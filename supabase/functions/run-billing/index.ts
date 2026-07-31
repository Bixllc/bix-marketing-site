/* ==========================================================================
   run-billing — the monthly billing cycle, run once a day by pg_cron.

   Raise on the 1st, due by the 3rd, overdue after. Every step is idempotent
   so a double-fire, a retry or two overlapping runs cannot bill anyone twice
   or send the same email again.

   Called with the service-role key, not a user token: there is no human in
   this loop.
   ========================================================================== */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const money = (n: number) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const longDate = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/* Reminders go out on these days past due, once each. Bounded on purpose —
   an unpaid invoice should become a conversation, not an endless drip. */
const REMINDER_DAYS = [1, 7, 14, 30]

function shell(title: string, intro: string, rows: string, cta: string, foot: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F6F5F8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F5F8;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(20,16,31,.08);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <tr><td style="background:linear-gradient(120deg,#442061,#2E89E6);padding:22px 28px;">
    <div style="color:#fff;font-size:17px;font-weight:600;letter-spacing:-.01em;">Bix LLC</div>
  </td></tr>
  <tr><td style="padding:28px;">
    <h1 style="margin:0 0 14px;font-size:19px;font-weight:600;color:#14101F;">${title}</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3B3548;">${intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid rgba(20,16,31,.09);border-radius:12px;padding:4px 16px;margin-bottom:22px;">
      ${rows}
    </table>
    ${cta}
    <p style="margin:22px 0 0;font-size:12.5px;line-height:1.6;color:#6C6577;">${foot}</p>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid rgba(20,16,31,.06);">
    <div style="font-size:11.5px;color:#968FA3;">Bix LLC · admin@bixllc.net</div>
  </td></tr>
</table></td></tr></table></body></html>`
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:11px 0;font-size:12.5px;color:#6C6577;">${k}</td>
       <td style="padding:11px 0;font-size:13.5px;color:#14101F;font-weight:600;text-align:right;">${v}</td></tr>`

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#442061;color:#fff;text-decoration:none;
     font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">${label}</a>`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
                    Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
  const db = createClient(Deno.env.get('SUPABASE_URL')!, secretKey,
    { auth: { autoRefreshToken: false, persistSession: false } })

  /* Only the service key may run this. It is scheduled, not user-facing. */
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || token !== secretKey) return json({ error: 'Forbidden' }, 403)

  const RESEND = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('BILLING_FROM') ?? 'Bix LLC <billing@bixllc.net>'
  const PORTAL = (Deno.env.get('SITE_URL') ?? 'https://bixllc.net').replace(/\/$/, '') + '/portal/'

  const today = new Date().toISOString().slice(0, 10)
  const period = today.slice(0, 8) + '01'
  const dayOfMonth = Number(today.slice(8, 10))

  const url = new URL(req.url)
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body is fine */ }

  /* A real dry run: report what would happen and change nothing. Previously
     the only "dry" behaviour was the absence of an API key, which meant the
     moment a key existed the job sent for real. */
  const dry = url.searchParams.get('dry') === '1' || body.dry === true
  /* Invoices are raised at the start of the month, never backfilled into one
     already underway — running on the 31st must not produce an invoice dated
     the 1st that is instantly four weeks overdue. `force` is for a deliberate
     catch-up after a missed schedule. */
  const BILLING_WINDOW = 3
  const force = body.force === true
  const inWindow = dayOfMonth <= BILLING_WINDOW || force

  const out = {
    dry, willSend: !!RESEND && !dry, period, dayOfMonth, inWindow,
    raised: 0, aged: 0, sent: 0, reminded: 0, skipped: [] as string[], errors: [] as string[],
  }
  if (!inWindow) out.skipped.push(`day ${dayOfMonth} is outside the 1–${BILLING_WINDOW} billing window; no invoices raised`)

  async function send(to: string, subject: string, html: string) {
    if (dry) { out.skipped.push(`would email ${to}: ${subject}`); return false }
    if (!RESEND) { out.errors.push('RESEND_API_KEY not set — nothing sent'); return false }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (r.ok) return true
    out.errors.push(`send to ${to}: ${await r.text()}`)
    return false
  }

  try {
    // 1. raise this month's invoices, only inside the billing window
    if (inWindow && !dry) {
      const { data: raised, error: raiseErr } = await db.rpc('raise_monthly_invoices', { p_period: period })
      if (raiseErr) out.errors.push('raise: ' + raiseErr.message)
      else out.raised = raised?.[0]?.created ?? 0
    } else if (inWindow && dry) {
      const { count } = await db.from('profiles').select('id', { count: 'exact', head: true })
        .eq('role', 'client').eq('status', 'Active').gt('plan_price', 0)
      out.skipped.push(`would raise ${count ?? 0} invoice(s) for ${period}`)
    }

    // 2. age anything past its due date
    if (!dry) {
      const { data: aged, error: ageErr } = await db.rpc('age_invoices')
      if (ageErr) out.errors.push('age: ' + ageErr.message)
      else out.aged = aged?.[0]?.marked ?? 0
    }

    // 3. email the drafts, then mark them Outstanding — in that order, so a
    //    failed send leaves the invoice re-sendable rather than silently owed
    const { data: drafts } = await db
      .from('invoices')
      .select('id, number, descr, amount, due, client_id, profiles!inner(business, email)')
      .eq('status', 'Draft')

    for (const inv of drafts ?? []) {
      const p = (inv as any).profiles
      if (!p?.email) { out.errors.push(`${inv.number}: client has no email`); continue }

      const ok = await send(p.email, `Invoice ${inv.number} from Bix LLC`,
        shell(
          `Invoice ${inv.number}`,
          `Hi ${p.business ?? 'there'}, here is your invoice for this month. It is due by <strong>${longDate(inv.due)}</strong>.`,
          row('Description', inv.descr ?? '') + row('Amount', money(inv.amount)) + row('Due', longDate(inv.due)),
          button(PORTAL, 'View in your portal'),
          'You can settle this from your portal at any time. Reply to this email with any questions.'))

      if (ok) {
        await db.from('invoices')
          .update({ status: 'Outstanding', sent_at: new Date().toISOString() })
          .eq('id', inv.id)
        out.sent++
      }
    }

    // 4. remind on overdue invoices, once per scheduled day
    const { data: late } = await db
      .from('invoices')
      .select('id, number, amount, due, reminders, client_id, profiles!inner(business, email)')
      .eq('status', 'Overdue')

    for (const inv of late ?? []) {
      const p = (inv as any).profiles
      if (!p?.email) continue

      const daysLate = Math.floor(
        (Date.parse(today) - Date.parse(inv.due)) / 86400000)
      const dueCount = REMINDER_DAYS.filter((d) => daysLate >= d).length
      if (dueCount <= (inv.reminders ?? 0)) continue   // already covered

      const ok = await send(p.email, `Reminder — invoice ${inv.number} is overdue`,
        shell(
          `Invoice ${inv.number} is overdue`,
          `Hi ${p.business ?? 'there'}, this one was due on <strong>${longDate(inv.due)}</strong> and is now ${daysLate} day${daysLate === 1 ? '' : 's'} past.`,
          row('Amount', money(inv.amount)) + row('Was due', longDate(inv.due)) + row('Days late', String(daysLate)),
          button(PORTAL, 'Settle it now'),
          'If this has already been paid, ignore this. If something is holding it up, reply and we will sort it out.'))

      if (ok) {
        await db.from('invoices')
          .update({ reminders: dueCount, last_reminder: new Date().toISOString() })
          .eq('id', inv.id)
        out.reminded++
      }
    }

    return json({ ok: true, ...out })
  } catch (err) {
    return json({ error: (err as Error).message, ...out }, 500)
  }
})
