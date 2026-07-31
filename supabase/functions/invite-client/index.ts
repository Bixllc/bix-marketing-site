import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the caller is an admin. The service-role key below bypasses RLS,
    // so this check is the only thing standing between the anon key and the
    // ability to mint accounts.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return json({ error: 'Missing authorization' }, 401)

    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: 'Invalid session' }, 401)

    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return json({ error: 'Unauthorized' }, 403)

    const body = await req.json()
    const { email, full_name, business } = body
    if (!email) return json({ error: 'Email is required' }, 400)

    // Set SITE_URL in the function's secrets to point invites at the custom
    // domain. Whatever origin is used must also be listed under
    // Supabase → Authentication → URL Configuration → Redirect URLs.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://bixllc.net'

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: 'client', company: business },
      redirectTo: `${siteUrl.replace(/\/$/, '')}/set-password.html`,
    })

    if (inviteErr) {
      // A repeat invite is the common case — surface it as its own signal so
      // the console can say "already invited" instead of "something failed".
      const already = /already registered|already been registered/i.test(inviteErr.message)
      return json({ error: inviteErr.message, already }, already ? 409 : 400)
    }

    const id = invited?.user?.id
    if (!id) return json({ error: 'Invite succeeded but returned no user' }, 500)

    // The on_auth_user_created trigger writes id / role / full_name. Everything
    // else the portal displays has to be filled in here, while we still hold a
    // service-role client and the new user's id.
    const patch: Record<string, unknown> = { id, role: 'client', email }
    for (const k of ['full_name', 'business', 'phone', 'industry', 'address',
                     'timezone', 'plan', 'plan_price', 'next_billing']) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== '') patch[k] = body[k]
    }
    // `company` is the legacy column the original schema shipped with; keep it
    // in step so older queries do not read blank.
    if (business) patch.company = business

    const { error: profileErr } = await admin
      .from('profiles').upsert(patch, { onConflict: 'id' })

    if (profileErr) {
      // The account exists and the invite is sent; only the detail fields
      // failed. Say so precisely rather than implying nothing happened.
      return json({
        success: true,
        id,
        warning: `Invited, but the profile details did not save: ${profileErr.message}`,
      })
    }

    return json({ success: true, id })
  } catch (err) {
    return json({ error: (err as Error).message }, 400)
  }
})
