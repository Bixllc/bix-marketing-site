import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is an admin
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(token!)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user?.id ?? '').single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const { email, full_name, company } = await req.json()

    // Set SITE_URL in the function's secrets to point invites at a custom
    // domain. Whatever origin is used must also be listed under
    // Supabase → Authentication → URL Configuration → Redirect URLs.
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://bix-marketing-site.vercel.app'

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: 'client', company },
      redirectTo: `${siteUrl.replace(/\/$/, '')}/set-password.html`
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
