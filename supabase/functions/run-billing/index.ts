/* ==========================================================================
   run-billing — raising and sending invoices.

   Nothing here runs on a schedule. Every send is a deliberate action taken
   from the console, and each one names exactly which invoice it is sending.

   Callable two ways:
     • an admin's own token, from the console      (the normal path)
     • the service key, if a schedule is ever added (none exists today)

   Actions
     raise   create this month's invoices as Drafts. Sends nothing.
     send    email one Draft, then mark it Outstanding.
     remind  email one Overdue invoice and count the reminder.
     status  report what exists. Changes nothing.

   Every action accepts { dry: true }, which reports intent and changes
   nothing at all.
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
           style="border:1px solid rgba(20,16,31,.09);border-radius:12px;padding:4px 16px;margin-bottom:22px;">${rows}</table>
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

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return json({ error: 'Missing authorization' }, 401)

  /* Either the service key, or a signed-in admin. Anyone else is refused
     before a single row is read. */
  let caller = 'service'
  if (token !== secretKey) {
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return json({ error: 'Invalid session' }, 401)
    const { data: prof, error: lookupErr } = await db
      .from('profiles').select('role, full_name').eq('id', user.id).single()
    if (prof?.role !== 'admin') {
      return json({ error: 'Unauthorized', seenRole: prof?.role ?? null,
                    lookupError: lookupErr?.message ?? null }, 403)
    }
    caller = prof.full_name || 'admin'
  }

  const RESEND = Deno.env.get('RESEND_API_KEY')
  const FROM = Deno.env.get('BILLING_FROM') ?? 'Bix LLC <billing@bixllc.net>'
  const PORTAL = (Deno.env.get('SITE_URL') ?? 'https://bixllc.net').replace(/\/$/, '') + '/portal/'

  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* empty body is fine */ }

  const action: string = body.action ?? 'status'
  const dry: boolean = body.dry === true
  const today = new Date().toISOString().slice(0, 10)
  const period: string = body.period ?? (today.slice(0, 8) + '01')

  const out: Record<string, any> = { action, dry, caller, period, done: [], errors: [] as string[] }

  async function send(to: string, subject: string, html: string) {
    if (dry) { out.done.push(`would email ${to} — ${subject}`); return false }
    if (!RESEND) { out.errors.push('RESEND_API_KEY is not set, so nothing can be sent'); return false }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (r.ok) return true
    out.errors.push(`send to ${to}: ${await r.text()}`)
    return false
  }

  const withClient = 'id, number, descr, amount, due, status, reminders, client_id, profiles!inner(business, email)'

  try {
    /* ---------------------------------------------------------- status --- */
    if (action === 'status') {
      const { data: inv } = await db.from('invoices')
        .select('number, amount, status, due, period, profiles!inner(business)')
        .order('due', { ascending: false }).limit(50)
      out.emailConfigured = !!RESEND
      out.invoices = (inv ?? []).map((i: any) => ({
        number: i.number, client: i.profiles?.business, amount: Number(i.amount),
        status: i.status, due: i.due, period: i.period,
      }))
      return json({ ok: true, ...out })
    }

    /* ----------------------------------------------------------- raise --- */
    /* Creates Drafts only. A Draft has been recorded but not sent, so there
       is always a review step between raising and emailing. */
    if (action === 'raise') {
      const { data: eligible } = await db.from('profiles')
        .select('business, plan_price').eq('role', 'client').eq('status', 'Active').gt('plan_price', 0)

      if (dry) {
        out.done = (eligible ?? []).map((p: any) => `would raise ${money(p.plan_price)} for ${p.business}`)
        return json({ ok: true, ...out })
      }
      const { data, error } = await db.rpc('raise_monthly_invoices', { p_period: period })
      if (error) out.errors.push(error.message)
      else out.raised = data?.[0]?.created ?? 0
      out.done.push(`raised ${out.raised} draft invoice(s) for ${period}`)
      return json({ ok: !out.errors.length, ...out })
    }

    /* ------------------------------------------------------------ send --- */
    /* One invoice, named explicitly. Emails first, then marks Outstanding —
       a failed send leaves it re-sendable rather than silently owed. */
    if (action === 'send') {
      if (!body.id) return json({ error: 'An invoice id is required' }, 400)
      const { data: inv, error } = await db.from('invoices').select(withClient).eq('id', body.id).single()
      if (error || !inv) return json({ error: 'Invoice not found' }, 404)

      const p: any = (inv as any).profiles
      if (!p?.email) return json({ error: `${inv.number}: that client has no email address` }, 400)

      const ok = await send(p.email, `Invoice ${inv.number} from Bix LLC`,
        shell(`Invoice ${inv.number}`,
          `Hi ${p.business ?? 'there'}, here is your invoice. It is due by <strong>${longDate(inv.due)}</strong>.`,
          row('Description', inv.descr ?? '') + row('Amount', money(Number(inv.amount))) + row('Due', longDate(inv.due)),
          button(PORTAL, 'View in your portal'),
          'You can settle this from your portal at any time. Reply to this email with any questions.'))

      if (ok) {
        await db.from('invoices')
          .update({ status: 'Outstanding', sent_at: new Date().toISOString() }).eq('id', inv.id)
        out.done.push(`sent ${inv.number} to ${p.email}`)
      }
      return json({ ok: ok || dry, ...out })
    }

    /* ---------------------------------------------------------- remind --- */
    if (action === 'remind') {
      if (!body.id) return json({ error: 'An invoice id is required' }, 400)
      const { data: inv, error } = await db.from('invoices').select(withClient).eq('id', body.id).single()
      if (error || !inv) return json({ error: 'Invoice not found' }, 404)

      const p: any = (inv as any).profiles
      if (!p?.email) return json({ error: `${inv.number}: that client has no email address` }, 400)

      const daysLate = Math.max(0, Math.floor((Date.parse(today) - Date.parse(inv.due)) / 86400000))
      const ok = await send(p.email, `Reminder — invoice ${inv.number}`,
        shell(`Invoice ${inv.number} is outstanding`,
          `Hi ${p.business ?? 'there'}, this one was due on <strong>${longDate(inv.due)}</strong>` +
          (daysLate ? ` and is now ${daysLate} day${daysLate === 1 ? '' : 's'} past.` : '.'),
          row('Amount', money(Number(inv.amount))) + row('Was due', longDate(inv.due)),
          button(PORTAL, 'Settle it now'),
          'If this has already been paid, please ignore it. If something is holding it up, reply and we will sort it out.'))

      if (ok) {
        await db.from('invoices').update({
          reminders: (inv.reminders ?? 0) + 1,
          last_reminder: new Date().toISOString(),
        }).eq('id', inv.id)
        out.done.push(`reminded ${p.email} about ${inv.number}`)
      }
      return json({ ok: ok || dry, ...out })
    }

    return json({ error: `Unknown action "${action}"` }, 400)
  } catch (err) {
    return json({ error: (err as Error).message, ...out }, 500)
  }
})
