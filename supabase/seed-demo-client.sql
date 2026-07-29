-- ============================================================
-- Seed one fully populated client so the portal can be seen with
-- real data in it.
--
-- BEFORE RUNNING: create the auth user first.
--   Supabase → Authentication → Users → Add user
--   Email: demo@sereneskinstudio.com   (set any password, tick auto-confirm)
--
-- profiles.id is a foreign key to auth.users, so the account has to
-- exist before there is a profile to attach anything to. This script
-- looks the user up by email and fills in everything else.
--
-- Safe to re-run: it clears this client's rows first.
-- ============================================================

do $$
declare
  v_email text := 'demo@sereneskinstudio.com';   -- <= change if you used another address
  v_id    uuid;
  v_proj  uuid;
  v_req   uuid;
begin
  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    raise exception 'No auth user with email %. Create it under Authentication → Users first.', v_email;
  end if;

  -- ---------- profile ----------
  insert into public.profiles (id, role, full_name, company)
  values (v_id, 'client', 'Kadeen Morgan', 'Serene Skin Studio')
  on conflict (id) do update set role = 'client', full_name = excluded.full_name;

  update public.profiles set
    business     = 'Serene Skin Studio',
    email        = v_email,
    phone        = '(876) 555-0148',
    industry     = 'Beauty & wellness',
    address      = '14 Hope Road, Kingston 10, Jamaica',
    timezone     = 'America/Jamaica',
    plan         = 'Growth Care',
    plan_price   = 340,
    next_billing = current_date + 12,
    storage_used = 2.4
  where id = v_id;

  -- ---------- clear any previous seed for this client ----------
  delete from public.request_comments where request_id in (select id from public.requests where client_id = v_id);
  delete from public.requests  where client_id = v_id;
  delete from public.invoices  where client_id = v_id;
  delete from public.payments  where client_id = v_id;
  delete from public.files     where client_id = v_id;
  delete from public.meetings  where client_id = v_id;
  delete from public.activity  where client_id = v_id;
  delete from public.tickets   where client_id = v_id;
  delete from public.phases    where project_id in (select id from public.projects where client_id = v_id);
  delete from public.projects  where client_id = v_id;

  -- ---------- project ----------
  insert into public.projects
    (client_id, name, description, status, live_url, phase, progress, stack,
     launched, next_milestone, summary, last_updated, health_score, uptime, load_time)
  values
    (v_id,
     'Serene Skin Studio — booking site & client system',
     'Online booking, deposits and automated reminders.',
     'Live',
     'https://sereneskinstudio.com',
     'Phase 4 · Optimisation',
     78,
     'Custom build + Stripe + Twilio',
     current_date - 84,
     'Loyalty & rebooking flow — ' || to_char(current_date + 9, 'Mon DD'),
     'Replacing DM bookings and paper intake with a self-serve site: online booking, deposits, digital consultation forms and automatic reminders.',
     current_date - 3,
     94, '99.98%', '0.9s')
  returning id into v_proj;

  -- ---------- phases ----------
  insert into public.phases (project_id, name, note, state, position) values
    (v_proj, 'Discovery & scoping',  'Workshops, service menu audit, deposit policy agreed', 'done', 0),
    (v_proj, 'Design & content',     'Brand direction, service pages, consultation copy',    'done', 1),
    (v_proj, 'Build & launch',       'Booking engine, Stripe deposits, SMS reminders',       'done', 2),
    (v_proj, 'Optimisation',         'Loyalty flow, rebooking prompts, speed pass',          'now',  3),
    (v_proj, 'Handover & training',  'Team walkthrough and admin guide',                     'todo', 4);

  -- ---------- requests ----------
  insert into public.requests (client_id, ref, title, category, priority, status, body, created_at)
  values (v_id, 'REQ-1042', 'Add gift certificates to the booking flow', 'Feature', 'High', 'In progress',
          'We get asked for gift certificates constantly around holidays. Ideally a client can buy one online, get a code by email, and redeem it at checkout.',
          now() - interval '2 days')
  returning id into v_req;

  insert into public.request_comments (request_id, author, body, created_at)
  values (v_req, 'Andre Thompson',
          'Scoped it — Stripe handles the payment, we generate and validate the code. Two to three days of build.',
          now() - interval '1 day');

  insert into public.requests (client_id, ref, title, category, priority, status, body, created_at) values
    (v_id, 'REQ-1041', 'Update facial pricing for August', 'Content', 'Medium', 'Completed',
     'Hydrafacial goes to $9,500 JMD and the express facial to $6,000 JMD from 1 August.', now() - interval '5 days'),
    (v_id, 'REQ-1040', 'Deposit not releasing on cancellation', 'Bug', 'High', 'Completed',
     'A client cancelled inside the 48-hour window and the deposit stayed held instead of being forfeited.', now() - interval '8 days'),
    (v_id, 'REQ-1038', 'Instagram feed on the homepage', 'Feature', 'Low', 'Open',
     'Would love the last six posts showing under the hero so the site feels current between updates.', now() - interval '14 days'),
    (v_id, 'REQ-1036', 'Add a waitlist for fully booked days', 'Feature', 'Medium', 'Open',
     'When a day is full, let clients join a waitlist and get a text if something opens up.', now() - interval '23 days');

  -- ---------- invoices ----------
  insert into public.invoices (client_id, number, descr, issued, due, amount, status) values
    (v_id, 'INV-2043', 'Growth Care — August retainer',     current_date - 4,  current_date + 10, 340,  'Outstanding'),
    (v_id, 'INV-2042', 'Gift certificate module — build',   current_date - 9,  current_date - 1,  620,  'Overdue'),
    (v_id, 'INV-2041', 'Growth Care — July retainer',       current_date - 35, current_date - 21, 340,  'Paid'),
    (v_id, 'INV-2040', 'Loyalty flow — discovery',          current_date - 41, current_date - 27, 480,  'Paid'),
    (v_id, 'INV-2037', 'Build & launch — final instalment', current_date - 84, current_date - 70, 2400, 'Paid');

  insert into public.payments (client_id, invoice_no, method, amount, paid_on) values
    (v_id, 'INV-2041', 'Visa •••• 4417', 340,  current_date - 21),
    (v_id, 'INV-2040', 'Visa •••• 4417', 480,  current_date - 27),
    (v_id, 'INV-2037', 'Bank transfer',  2400, current_date - 70);

  -- ---------- files ----------
  insert into public.files (client_id, name, kind, size_label, folder, created_at) values
    (v_id, 'brand-style-guide.pdf',     'pdf', '4.2 MB', 'Brand',     now() - interval '96 days'),
    (v_id, 'service-menu-august.docx',  'doc', '96 KB',  'Content',   now() - interval '5 days'),
    (v_id, 'consultation-form-v3.pdf',  'pdf', '312 KB', 'Content',   now() - interval '52 days'),
    (v_id, 'staff-admin-training.mp4',  'mp4', '186 MB', 'Training',  now() - interval '30 days'),
    (v_id, 'july-performance.xlsx',     'xls', '78 KB',  'Reports',   now() - interval '9 days'),
    (v_id, 'build-agreement.pdf',       'pdf', '286 KB', 'Contracts', now() - interval '112 days');

  -- ---------- meetings ----------
  insert into public.meetings (client_id, title, meets_on, meets_at, duration, upcoming, link, notes, attendees) values
    (v_id, 'Loyalty flow walkthrough', current_date + 4, '10:30', '45 min', true,
     'https://meet.google.com/bix-serene-loyalty',
     'Walk through the rebooking prompt and the points ladder before we build it.',
     array['Kadeen Morgan','Sheneska Williams']),
    (v_id, 'July performance review', current_date - 9, '14:00', '30 min', false, null,
     'Bookings up 22% on June. Deposits cut no-shows from roughly 1 in 5 to 1 in 14.',
     array['Kadeen Morgan','Sheneska Williams']),
    (v_id, 'Staff admin training', current_date - 30, '11:00', '60 min', false, null,
     'Covered blocking time off, editing a booking, refunding a deposit and pulling the day sheet.',
     array['Kadeen Morgan','Shanice Campbell']);

  -- ---------- activity ----------
  insert into public.activity (client_id, actor, action, created_at) values
    (v_id, 'Andre Thompson',    'started work on <b>gift certificates</b>',              now() - interval '2 hours'),
    (v_id, 'System',            'issued invoice <b>INV-2043</b>',                        now() - interval '4 days'),
    (v_id, 'Tameka Bailey',     'updated <b>August facial pricing</b> across the site',  now() - interval '5 days'),
    (v_id, 'Kadeen Morgan',     'submitted <b>REQ-1042</b>',                             now() - interval '2 days'),
    (v_id, 'Andre Thompson',    'deployed <b>deposit cancellation fix</b>',              now() - interval '8 days'),
    (v_id, 'Sheneska Williams', 'shared <b>July performance report</b>',                 now() - interval '9 days');

  -- ---------- tickets ----------
  insert into public.tickets (client_id, ref, subject, status, created_at) values
    (v_id, 'TK-318', 'SMS credits running low',     'In progress', now() - interval '3 days'),
    (v_id, 'TK-317', 'Can two staff share a room?', 'Completed',   now() - interval '16 days');

  raise notice 'Seeded Serene Skin Studio for %', v_email;
end $$;
