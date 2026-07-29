/* ==========================================================================
   BIX.data — all mock content for the client portal.
   Dates are generated relative to today so the account never reads stale.
   Cross-view figures are derived, not typed twice: the outstanding total is
   summed from the invoices, the open-request count from the request list.
   ========================================================================== */
window.BIX = window.BIX || {};

(function () {
  'use strict';

  var DAY = 86400000;
  var now = new Date();

  function shift(days) { return new Date(now.getTime() + days * DAY); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function ago(days) { return iso(shift(-days)); }
  function ahead(days) { return iso(shift(days)); }

  /* --------------------------------- client ------------------------------- */
  var client = {
    firstName: 'Kadeen',
    name: 'Kadeen Morgan',
    business: 'Serene Skin Studio',
    email: 'kadeen@sereneskinstudio.com',
    phone: '(876) 555-0148',
    initials: 'KM',
    plan: 'Growth Care',
    planPrice: 340,
    nextBilling: ahead(12),
    industry: 'Beauty & wellness',
    address: '14 Hope Road, Kingston 10, Jamaica',
    timezone: 'America/Jamaica (EST, no DST)'
  };

  /* --------------------------------- project ------------------------------ */
  var project = {
    name: 'Serene Skin Studio — booking site & client system',
    url: 'https://sereneskinstudio.com',
    status: 'Live',
    phase: 'Phase 4 · Optimisation',
    nextMilestone: 'Loyalty & rebooking flow — ' + ahead(9),
    launched: ago(84),
    stack: 'Custom build + Stripe + Twilio',
    lastUpdated: ago(3),
    progress: 78,
    summary:
      'Replacing DM bookings and paper intake with a self-serve site: online booking, ' +
      'deposits, digital consultation forms and automatic reminders.'
  };

  var phases = [
    { name: 'Discovery & scoping',      state: 'done', note: 'Workshops, service menu audit, deposit policy agreed' },
    { name: 'Design & content',         state: 'done', note: 'Brand direction, service pages, consultation copy' },
    { name: 'Build & launch',           state: 'done', note: 'Booking engine, Stripe deposits, SMS reminders' },
    { name: 'Optimisation',             state: 'now',  note: 'Loyalty flow, rebooking prompts, speed pass' },
    { name: 'Handover & training',      state: 'todo', note: 'Team walkthrough and admin guide' }
  ];

  var deliverables = [
    { name: 'Booking engine with deposits',        type: 'system', date: ago(84) },
    { name: 'Digital consultation & intake forms', type: 'system', date: ago(80) },
    { name: 'Automated SMS + email reminders',     type: 'system', date: ago(76) },
    { name: 'Service menu & pricing pages',        type: 'page',   date: ago(88) },
    { name: 'Brand style guide (PDF)',             type: 'doc',    date: ago(96) },
    { name: 'Staff admin walkthrough (video)',     type: 'video',  date: ago(30) }
  ];

  var team = [
    { name: 'Sheneska Williams', role: 'Lead & strategy',  initials: 'SW' },
    { name: 'Andre Thompson',    role: 'Engineering',      initials: 'AT' },
    { name: 'Tameka Bailey',     role: 'Design',           initials: 'TB' }
  ];

  /* -------------------------------- requests ------------------------------ */
  var requests = [
    { id: 'REQ-1042', title: 'Add gift certificates to the booking flow', category: 'Feature', priority: 'High',   status: 'In progress', date: ago(2),
      desc: 'We get asked for gift certificates constantly around holidays. Ideally a client can buy one online, get a code by email, and redeem it at checkout.',
      comments: [{ who: 'Andre Thompson', w: '1 day ago', t: 'Scoped it — Stripe handles the payment, we generate and validate the code. Two to three days of build.' }] },
    { id: 'REQ-1041', title: 'Update facial pricing for August', category: 'Content', priority: 'Medium', status: 'Completed',  date: ago(5),
      desc: 'Hydrafacial goes to $9,500 JMD and the express facial to $6,000 JMD from 1 August.',
      comments: [{ who: 'Tameka Bailey', w: '4 days ago', t: 'Updated across the service menu, booking engine and the homepage panel. Live now.' }] },
    { id: 'REQ-1040', title: 'Deposit not releasing on cancellation', category: 'Bug', priority: 'High', status: 'Completed', date: ago(8),
      desc: 'A client cancelled inside the 48-hour window and the deposit stayed held instead of being forfeited per our policy.',
      comments: [{ who: 'Andre Thompson', w: '7 days ago', t: 'Timezone bug — the cutoff was calculating in UTC rather than Jamaica time. Fixed and backfilled the three affected bookings.' }] },
    { id: 'REQ-1039', title: 'Add Shanice to the staff calendar', category: 'Feature', priority: 'Medium', status: 'Completed', date: ago(11),
      desc: 'New esthetician starting — needs her own calendar, services and availability.', comments: [] },
    { id: 'REQ-1038', title: 'Instagram feed on the homepage', category: 'Feature', priority: 'Low', status: 'Open', date: ago(14),
      desc: 'Would love the last six posts showing under the hero so the site feels current between updates.', comments: [] },
    { id: 'REQ-1037', title: 'Reminder SMS arriving too late', category: 'Bug', priority: 'High', status: 'Completed', date: ago(19),
      desc: 'Reminders were landing about an hour before the appointment instead of the evening before.',
      comments: [{ who: 'Andre Thompson', w: '18 days ago', t: 'Scheduler was using appointment-time minus one hour. Now sends 6pm the previous day.' }] },
    { id: 'REQ-1036', title: 'Add a waitlist for fully booked days', category: 'Feature', priority: 'Medium', status: 'Open', date: ago(23),
      desc: 'When a day is full, let clients join a waitlist and get a text if something opens up.', comments: [] },
    { id: 'REQ-1035', title: 'Swap the treatment room photos', category: 'Content', priority: 'Low', status: 'Completed', date: ago(28),
      desc: 'New photos from the shoot — replacing the ones from the old space.', comments: [] },
    { id: 'REQ-1034', title: 'Google review prompt after appointments', category: 'Feature', priority: 'Medium', status: 'Completed', date: ago(34),
      desc: 'Send a review link a day after the appointment, only to clients who actually showed.', comments: [] },
    { id: 'REQ-1033', title: 'Fix mobile spacing on the service menu', category: 'Bug', priority: 'Low', status: 'Completed', date: ago(41),
      desc: 'Prices were wrapping onto their own line on smaller phones and looked broken.', comments: [] },
    { id: 'REQ-1032', title: 'Consultation form — add medication field', category: 'Content', priority: 'Medium', status: 'Completed', date: ago(52),
      desc: 'We need to capture current medications for the chemical peel consent.', comments: [] },
    { id: 'REQ-1031', title: 'Package pricing for 6-session bundles', category: 'Feature', priority: 'Medium', status: 'Open', date: ago(63),
      desc: 'Clients buying six sessions up front should get a bundle price and a balance they can draw down.', comments: [] }
  ];

  /* -------------------------------- invoices ------------------------------ */
  var invoices = [
    { no: 'INV-2043', desc: 'Growth Care — August retainer',      issued: ago(4),  due: ahead(10), amount: 340, status: 'Outstanding' },
    { no: 'INV-2042', desc: 'Gift certificate module — build',    issued: ago(9),  due: ago(1),    amount: 620, status: 'Overdue' },
    { no: 'INV-2041', desc: 'Growth Care — July retainer',        issued: ago(35), due: ago(21),   amount: 340, status: 'Paid' },
    { no: 'INV-2040', desc: 'Loyalty flow — discovery',           issued: ago(41), due: ago(27),   amount: 480, status: 'Paid' },
    { no: 'INV-2039', desc: 'Growth Care — June retainer',        issued: ago(66), due: ago(52),   amount: 340, status: 'Paid' },
    { no: 'INV-2038', desc: 'SMS credit top-up (2,000)',          issued: ago(72), due: ago(58),   amount: 95,  status: 'Paid' },
    { no: 'INV-2037', desc: 'Build & launch — final instalment',  issued: ago(84), due: ago(70),   amount: 2400, status: 'Paid' },
    { no: 'INV-2036', desc: 'Build & launch — deposit',           issued: ago(112), due: ago(98),  amount: 2400, status: 'Paid' }
  ];

  var payments = [
    { on: ago(21), method: 'Visa •••• 4417', amount: 340,  ref: 'INV-2041' },
    { on: ago(27), method: 'Visa •••• 4417', amount: 480,  ref: 'INV-2040' },
    { on: ago(52), method: 'Visa •••• 4417', amount: 340,  ref: 'INV-2039' },
    { on: ago(58), method: 'Bank transfer',  amount: 95,   ref: 'INV-2038' },
    { on: ago(70), method: 'Bank transfer',  amount: 2400, ref: 'INV-2037' }
  ];

  var paymentMethod = { brand: 'VISA', last4: '4417', exp: '09 / 28' };

  /* -------------------------------- meetings ------------------------------ */
  var meetings = [
    { id: 'M-08', title: 'Loyalty flow walkthrough', when: ahead(4), time: '10:30', dur: '45 min', upcoming: true,
      attendees: ['Kadeen Morgan', 'Sheneska Williams', 'Tameka Bailey'],
      link: 'https://meet.google.com/bix-serene-loyalty',
      notes: 'Walk through the rebooking prompt and the points ladder before we build it.' },
    { id: 'M-07', title: 'July performance review', when: ago(9), time: '14:00', dur: '30 min', upcoming: false,
      attendees: ['Kadeen Morgan', 'Sheneska Williams'],
      notes: 'Bookings up 22% on June. Deposits have cut no-shows from roughly 1 in 5 to 1 in 14. Agreed to prioritise gift certificates before the December rush.' },
    { id: 'M-06', title: 'Staff admin training', when: ago(30), time: '11:00', dur: '60 min', upcoming: false,
      attendees: ['Kadeen Morgan', 'Shanice Campbell', 'Andre Thompson'],
      notes: 'Covered blocking time off, editing a booking, refunding a deposit and pulling the day sheet. Recording saved to Files.' },
    { id: 'M-05', title: 'Launch day check-in', when: ago(84), time: '09:00', dur: '30 min', upcoming: false,
      attendees: ['Kadeen Morgan', 'Sheneska Williams', 'Andre Thompson'],
      notes: 'Site live, first four bookings came in within the hour. Watch the SMS credit balance.' }
  ];

  /* --------------------------------- files -------------------------------- */
  var files = [
    { name: 'brand-style-guide.pdf',        kind: 'pdf', size: '4.2 MB',  date: ago(96), folder: 'Brand' },
    { name: 'logo-primary.svg',             kind: 'svg', size: '38 KB',   date: ago(96), folder: 'Brand' },
    { name: 'treatment-room-01.jpg',        kind: 'img', size: '2.8 MB',  date: ago(28), folder: 'Photos', src: '../smoove-screenshot.png' },
    { name: 'treatment-room-02.jpg',        kind: 'img', size: '3.1 MB',  date: ago(28), folder: 'Photos', src: '../smoove-fullpage.png' },
    { name: 'service-menu-august.docx',     kind: 'doc', size: '96 KB',   date: ago(5),  folder: 'Content' },
    { name: 'consultation-form-v3.pdf',     kind: 'pdf', size: '312 KB',  date: ago(52), folder: 'Content' },
    { name: 'staff-admin-training.mp4',     kind: 'mp4', size: '186 MB',  date: ago(30), folder: 'Training' },
    { name: 'admin-quick-guide.pdf',        kind: 'pdf', size: '1.1 MB',  date: ago(30), folder: 'Training' },
    { name: 'july-performance.xlsx',        kind: 'xls', size: '78 KB',   date: ago(9),  folder: 'Reports' },
    { name: 'deposit-policy-signed.pdf',    kind: 'pdf', size: '204 KB',  date: ago(104), folder: 'Contracts' },
    { name: 'build-agreement.pdf',          kind: 'pdf', size: '286 KB',  date: ago(112), folder: 'Contracts' },
    { name: 'homepage-hero-final.png',      kind: 'img', size: '1.9 MB',  date: ago(88), folder: 'Photos', src: '../amavi-screenshot.png' }
  ];

  var storage = { usedGb: 2.4, totalGb: 10 };

  /* -------------------------------- activity ------------------------------ */
  var activity = [
    { who: 'Andre Thompson',    what: 'started work on <b>gift certificates</b>',            w: '2 hours ago' },
    { who: 'System',            what: 'invoice <b>INV-2043</b> was issued',                  w: '4 days ago' },
    { who: 'Tameka Bailey',     what: 'updated <b>August facial pricing</b> across the site', w: '5 days ago' },
    { who: 'Kadeen Morgan',     what: 'submitted <b>REQ-1042</b>',                            w: '2 days ago' },
    { who: 'Andre Thompson',    what: 'deployed <b>deposit cancellation fix</b>',             w: '8 days ago' },
    { who: 'Sheneska Williams', what: 'shared <b>July performance report</b>',                w: '9 days ago' },
    { who: 'System',            what: 'payment received for <b>INV-2041</b>',                 w: '21 days ago' },
    { who: 'Andre Thompson',    what: 'added <b>Shanice</b> to the staff calendar',           w: '11 days ago' },
    { who: 'Tameka Bailey',     what: 'replaced <b>treatment room photos</b>',                w: '28 days ago' },
    { who: 'Sheneska Williams', what: 'ran <b>staff admin training</b>',                      w: '30 days ago' }
  ];

  /* -------------------------------- website ------------------------------- */
  var website = {
    score: 94,
    uptime: '99.98%',
    load: '0.9s',
    ssl: 'Valid',
    sslUntil: ahead(214),
    backup: ago(1),
    host: 'Bix managed hosting',
    region: 'US East (Ashburn)',
    domain: 'sereneskinstudio.com',
    domainExpiry: ahead(241),
    shot: '../smoove-fullpage.png',
    deploys: [
      { what: 'August pricing update',        on: ago(5),  by: 'Tameka Bailey' },
      { what: 'Deposit cancellation fix',     on: ago(8),  by: 'Andre Thompson' },
      { what: 'Staff calendar — Shanice',     on: ago(11), by: 'Andre Thompson' },
      { what: 'Reminder scheduler fix',       on: ago(19), by: 'Andre Thompson' },
      { what: 'Treatment room photography',   on: ago(28), by: 'Tameka Bailey' }
    ]
  };

  /* ------------------------------- analytics ------------------------------ */
  /* Deterministic series — no Math.random, so figures never contradict a reload. */
  function series(days, base, swing, drift) {
    var out = [], i;
    for (i = days - 1; i >= 0; i--) {
      var t = (days - 1 - i);
      var wave = Math.sin(t / 2.6) * swing + Math.cos(t / 5.1) * (swing * 0.5);
      out.push({ d: ago(i), v: Math.max(0, Math.round(base + wave + t * drift)) });
    }
    return out;
  }

  var analytics = {
    visitors: series(90, 118, 26, 0.42),
    leads:    series(90, 9,  3.1, 0.05),
    sources: [
      { name: 'Instagram',    pct: 41 },
      { name: 'Google search', pct: 28 },
      { name: 'Direct',       pct: 17 },
      { name: 'Referrals',    pct: 9 },
      { name: 'WhatsApp',     pct: 5 }
    ],
    topPages: [
      { path: '/book',                views: 4820, avg: '2m 41s', conv: '12.4%' },
      { path: '/services/hydrafacial', views: 3110, avg: '1m 58s', conv: '9.1%' },
      { path: '/',                    views: 2960, avg: '1m 12s', conv: '4.8%' },
      { path: '/services',            views: 2140, avg: '2m 06s', conv: '7.2%' },
      { path: '/about',               views: 980,  avg: '0m 54s', conv: '2.1%' }
    ],
    revenue: 18420,
    deltas: { visitors: 14.2, leads: 22.6, conv: 3.1, revenue: 19.4 }
  };

  /* --------------------------------- support ------------------------------ */
  var tickets = [
    { id: 'TK-318', subject: 'SMS credits running low',        opened: ago(3),  status: 'In progress' },
    { id: 'TK-317', subject: 'Can two staff share a room?',    opened: ago(16), status: 'Completed' },
    { id: 'TK-316', subject: 'Refund a deposit by mistake',    opened: ago(29), status: 'Completed' },
    { id: 'TK-315', subject: 'Change the booking cutoff time', opened: ago(44), status: 'Completed' }
  ];

  var faqs = [
    { q: 'How do I block off a day for holidays?',
      a: 'Open the staff calendar, tap the day, and choose “Block day”. Anything already booked stays put — you\'ll be asked whether to notify those clients.' },
    { q: 'What happens when a client cancels late?',
      a: 'Inside 48 hours the deposit is forfeited automatically and the slot reopens for booking. You can override it manually from the booking record if you want to be generous.' },
    { q: 'How do I add a new service?',
      a: 'Services live under Admin → Service menu. Add the name, duration, price and whether it needs a consultation form, and it appears in booking immediately.' },
    { q: 'Can I message clients directly from the portal?', a: 'Yes — open a client record and use the message panel.', needs: 'messages' },
    { q: 'How do I top up SMS credits?',
      a: 'Raise a ticket and we\'ll add credits the same day, then invoice them on your next retainer. A 2,000-credit top-up runs $95.' },
    { q: 'Who owns the site and the content?',
      a: 'You do — outright. Everything is documented in your build agreement under Files → Contracts.' },
    { q: 'Can Bix\'s AI assistant answer client questions for me?', a: 'The assistant can draft replies from your service menu.', needs: 'ai' }
  ];

  var tutorials = [
    { title: 'Taking a booking over the phone',   dur: '3:20' },
    { title: 'Editing your service menu',         dur: '4:45' },
    { title: 'Refunding or releasing a deposit',  dur: '2:38' },
    { title: 'Reading your monthly report',       dur: '5:12' },
    { title: 'Blocking time off for the team',    dur: '2:05' },
    { title: 'Chatting with the AI assistant',    dur: '3:44', needs: 'ai' },
    { title: 'Booking a meeting with your lead',  dur: '1:52', needs: 'booking' }
  ];

  var notifications = [
    { t: 'INV-2042 is now overdue',              w: '1 day ago',   kind: 'red' },
    { t: 'Andre started work on REQ-1042',       w: '2 hours ago', kind: 'blue' },
    { t: 'Loyalty flow walkthrough in 4 days',   w: '4 days ago',  kind: 'purple' }
  ];

  /* ---------------------------------- plans ------------------------------- */
  var plans = [
    { name: 'Essential Care', price: 180, blurb: 'Keep the lights on',
      items: ['2 change requests / month', 'Hosting & backups', '48-hour response', 'Uptime monitoring'] },
    { name: 'Growth Care', price: 340, blurb: 'Keep improving', current: true,
      items: ['6 change requests / month', 'Hosting & backups', '24-hour response', 'Monthly performance report', 'Quarterly strategy call'] },
    { name: 'Partner Care', price: 720, blurb: 'Treat us as your team',
      items: ['Unlimited change requests', 'Hosting & backups', 'Same-day response', 'Monthly strategy call', 'Priority build slots'] }
  ];

  var usage = [
    { k: 'Change requests', used: 4,  of: 6,  unit: 'this month' },
    { k: 'Support response', used: 6, of: 24, unit: 'hour average', invert: true },
    { k: 'Hours logged',     used: 11, of: 16, unit: 'this month' }
  ];

  /* ------------------------------- derived -------------------------------- */
  var outstanding = invoices
    .filter(function (i) { return i.status === 'Outstanding' || i.status === 'Overdue'; })
    .reduce(function (s, i) { return s + i.amount; }, 0);

  BIX.data = {
    client: client,
    project: project,
    phases: phases,
    deliverables: deliverables,
    team: team,
    requests: requests,
    invoices: invoices,
    payments: payments,
    paymentMethod: paymentMethod,
    meetings: meetings,
    files: files,
    storage: storage,
    activity: activity,
    website: website,
    analytics: analytics,
    tickets: tickets,
    faqs: faqs,
    tutorials: tutorials,
    notifications: notifications,
    plans: plans,
    usage: usage,
    outstanding: outstanding,
    /* recomputed after every mutation so counts never drift from the lists */
    recount: function () {
      BIX.data.outstanding = BIX.data.invoices
        .filter(function (i) { return i.status === 'Outstanding' || i.status === 'Overdue'; })
        .reduce(function (s, i) { return s + i.amount; }, 0);
    },
    countRequests: function (status) {
      return BIX.data.requests.filter(function (r) { return r.status === status; }).length;
    },
    ago: ago,
    ahead: ahead,
    today: iso(now)
  };
})();
