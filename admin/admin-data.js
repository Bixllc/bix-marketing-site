/* ==========================================================================
   admin-data.js — the agency's book of business.

   Every cross-view total (MRR, outstanding, pipeline, open leads) is DERIVED
   at the bottom of this file rather than typed in, so the dashboard can never
   disagree with the table it links to.
   ========================================================================== */
window.BIX = window.BIX || {};
(function () {
  'use strict';

  var TODAY = '2026-07-29';

  /* --------------------------------- team --------------------------------- */
  var team = [
    { id: 'sw', name: 'Sheneska Williams', role: 'Founder · Principal', email: 'admin@bixllc.net', initials: 'SW' },
    { id: 'at', name: 'Andre Thompson', role: 'Lead engineer', email: 'andre@bixllc.net', initials: 'AT' },
    { id: 'tb', name: 'Tameka Bailey', role: 'Design & content', email: 'tameka@bixllc.net', initials: 'TB' },
    { id: 'sc', name: 'Shanice Campbell', role: 'Client success', email: 'shanice@bixllc.net', initials: 'SC' }
  ];

  /* -------------------------------- clients -------------------------------- */
  var clients = [
    { id: 'c-serene', business: 'Serene Skin Studio', industry: 'Med spa', contact: 'Kadeen Morgan',
      email: 'kadeen@sereneskinstudio.com', phone: '(876) 555-0148', location: 'Kingston, JM',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 94, since: '2026-04-06',
      project: 'Booking site & client system', percent: 78 },
    { id: 'c-ironwood', business: 'Ironwood Strength Co.', industry: 'Gym', contact: 'Marcus Bell',
      email: 'marcus@ironwoodstrength.com', phone: '(713) 555-0192', location: 'Houston, TX',
      plan: 'Scale', mrr: 620, status: 'Active', health: 88, since: '2025-11-18',
      project: 'Member portal — phase 2', percent: 61 },
    { id: 'c-villa', business: 'Villa & Vine Realty', industry: 'Realty', contact: 'Alicia Grant',
      email: 'alicia@villaandvine.com', phone: '(876) 555-0173', location: 'Montego Bay, JM',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 91, since: '2026-01-22',
      project: 'Listing syndication', percent: 100 },
    { id: 'c-bright', business: 'Bright Steps Pediatrics', industry: 'Healthcare', contact: 'Dr. Renee Alvarez',
      email: 'renee@brightstepspeds.com', phone: '(713) 555-0166', location: 'Houston, TX',
      plan: 'Scale', mrr: 620, status: 'Active', health: 72, since: '2025-09-09',
      project: 'Intake & reminder automation', percent: 44 },
    { id: 'c-coral', business: 'Coral & Clay Boutique', industry: 'Retail', contact: 'Simone Weekes',
      email: 'simone@coralandclay.bb', phone: '(246) 555-0121', location: 'Bridgetown, BB',
      plan: 'Essential', mrr: 180, status: 'Active', health: 85, since: '2026-02-14',
      project: 'Storefront upkeep', percent: 100 },
    { id: 'c-pepper', business: 'Pepperpot Foods', industry: 'Food brand', contact: 'Devon Ramkissoon',
      email: 'devon@pepperpotfoods.tt', phone: '(868) 555-0139', location: 'Port of Spain, TT',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 58, since: '2025-12-03',
      project: 'Wholesale ordering portal', percent: 35 },
    { id: 'c-north', business: 'Northline Dental', industry: 'Healthcare', contact: 'Dr. Paul Whitfield',
      email: 'paul@northlinedental.com', phone: '(512) 555-0184', location: 'Austin, TX',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 90, since: '2026-03-02',
      project: 'Recall campaign build', percent: 82 },
    { id: 'c-studiore', business: 'Studio Ré Hair Lab', industry: 'Salon', contact: 'Rae Thompson',
      email: 'rae@studiore.jm', phone: '(876) 555-0157', location: 'Kingston, JM',
      plan: 'Essential', mrr: 180, status: 'Active', health: 79, since: '2026-05-11',
      project: 'Site & booking refresh', percent: 100 },
    { id: 'c-harbour', business: 'Harbour Point Rentals', industry: 'Property', contact: 'Tavares Knowles',
      email: 'tavares@harbourpoint.bs', phone: '(242) 555-0110', location: 'Nassau, BS',
      plan: 'Scale', mrr: 620, status: 'Active', health: 86, since: '2025-10-27',
      project: 'Booking engine rebuild', percent: 53 },
    { id: 'c-bloom', business: 'Bloom & Barrow Florals', industry: 'Retail', contact: 'Nadia Okafor',
      email: 'nadia@bloomandbarrow.com', phone: '(281) 555-0198', location: 'Katy, TX',
      plan: 'Essential', mrr: 180, status: 'At risk', health: 54, since: '2025-08-19',
      project: 'Seasonal storefront', percent: 100 },
    { id: 'c-cane', business: 'Cane Row Coffee', industry: 'Food brand', contact: 'Andre Griffith',
      email: 'andre@canerowcoffee.bb', phone: '(246) 555-0177', location: 'Bridgetown, BB',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 81, since: '2026-07-15',
      project: 'Subscription storefront', percent: 18 },
    { id: 'c-meridian', business: 'Meridian Physio', industry: 'Healthcare', contact: 'Camille Baptiste',
      email: 'camille@meridianphysio.jm', phone: '(876) 555-0163', location: 'Spanish Town, JM',
      plan: 'Growth Care', mrr: 340, status: 'Active', health: 76, since: '2026-07-08',
      project: 'Practice site & intake', percent: 12 }
  ];

  /* --------------------------------- leads --------------------------------- */
  var stages = [
    { id: 'new', name: 'New', color: '#968FA3' },
    { id: 'contacted', name: 'Contacted', color: '#2E89E6' },
    { id: 'qualified', name: 'Qualified', color: '#B5810F' },
    { id: 'proposal', name: 'Proposal', color: '#5B2A83' },
    { id: 'won', name: 'Won', color: '#1E8A5E' }
  ];

  function lead(o) {
    o.notes = o.notes || [];
    o.log = o.log || [{ at: o.touched, what: 'Lead created from ' + o.source }];
    return o;
  }

  var leads = [
    lead({ id: 'l-calabash', business: 'Calabash Bistro', contact: 'Nia Ferguson', email: 'nia@calabashbistro.jm',
      phone: '(876) 555-0204', industry: 'Restaurant', source: 'Instagram', value: 4800,
      stage: 'new', temp: 'hot', owner: 'sw', touched: '2026-07-28' }),
    lead({ id: 'l-peak', business: 'Peak Auto Detailing', contact: 'Rohan Sinclair', email: 'rohan@peakautodetail.com',
      phone: '(713) 555-0218', industry: 'Automotive', source: 'Referral', value: 3200,
      stage: 'new', temp: 'warm', owner: 'sc', touched: '2026-07-27' }),
    lead({ id: 'l-lumen', business: 'Lumen Optometry', contact: 'Dr. Trisha Nandlal', email: 'trisha@lumenoptometry.com',
      phone: '(868) 555-0231', industry: 'Healthcare', source: 'Google', value: 7500,
      stage: 'new', temp: 'warm', owner: 'sw', touched: '2026-07-26' }),
    lead({ id: 'l-tidewater', business: 'Tidewater Charters', contact: 'Brent Alleyne', email: 'brent@tidewatercharters.bb',
      phone: '(246) 555-0245', industry: 'Tourism', source: 'Instagram', value: 5600,
      stage: 'new', temp: 'cold', owner: 'sc', touched: '2026-07-22' }),

    lead({ id: 'l-sable', business: 'Sable & Stone Interiors', contact: 'Monique Persaud', email: 'monique@sableandstone.com',
      phone: '(868) 555-0259', industry: 'Interior design', source: 'Referral', value: 9200,
      stage: 'contacted', temp: 'hot', owner: 'sw', touched: '2026-07-25',
      notes: [{ at: '2026-07-25', by: 'Sheneska Williams', body: 'Wants a portfolio site plus a client proofing area. Budget is real — she quoted the range unprompted.' }] }),
    lead({ id: 'l-fitwell', business: 'Fitwell Physio', contact: 'Kemar Blake', email: 'kemar@fitwellphysio.jm',
      phone: '(876) 555-0262', industry: 'Healthcare', source: 'Website', value: 6400,
      stage: 'contacted', temp: 'warm', owner: 'sc', touched: '2026-07-24' }),
    lead({ id: 'l-roots', business: 'Roots Barbershop', contact: 'Damion Clarke', email: 'damion@rootsbarber.jm',
      phone: '(876) 555-0276', industry: 'Salon', source: 'Instagram', value: 2800,
      stage: 'contacted', temp: 'cold', owner: 'sc', touched: '2026-07-18' }),

    lead({ id: 'l-arbor', business: 'Arbor Lane Dental', contact: 'Dr. Hannah Reyes', email: 'hannah@arborlanedental.com',
      phone: '(512) 555-0283', industry: 'Healthcare', source: 'Google', value: 12500,
      stage: 'qualified', temp: 'hot', owner: 'sw', touched: '2026-07-26',
      notes: [{ at: '2026-07-26', by: 'Sheneska Williams', body: 'Two locations, one phone line, no online booking. Losing roughly 15 calls a week. Clear fit.' }] }),
    lead({ id: 'l-islandfresh', business: 'Island Fresh Produce', contact: 'Sherwin Baptiste', email: 'sherwin@islandfresh.tt',
      phone: '(868) 555-0297', industry: 'Food brand', source: 'Referral', value: 8800,
      stage: 'qualified', temp: 'warm', owner: 'at', touched: '2026-07-23' }),
    lead({ id: 'l-cobalt', business: 'Cobalt Fitness Collective', contact: 'Tasha Greene', email: 'tasha@cobaltfitness.com',
      phone: '(281) 555-0304', industry: 'Gym', source: 'Website', value: 7200,
      stage: 'qualified', temp: 'warm', owner: 'sc', touched: '2026-07-20' }),

    lead({ id: 'l-marigold', business: 'Marigold Events Co.', contact: 'Ayanna Bramble', email: 'ayanna@marigoldevents.bb',
      phone: '(246) 555-0318', industry: 'Events', source: 'Referral', value: 15400,
      stage: 'proposal', temp: 'hot', owner: 'sw', touched: '2026-07-27',
      notes: [{ at: '2026-07-27', by: 'Sheneska Williams', body: 'Proposal sent Monday. Wants the enquiry-to-quote flow automated before wedding season.' }] }),
    lead({ id: 'l-northgate', business: 'Northgate Realty Group', contact: 'Curtis Fenton', email: 'curtis@northgaterealty.com',
      phone: '(713) 555-0325', industry: 'Realty', source: 'Google', value: 18900,
      stage: 'proposal', temp: 'hot', owner: 'sw', touched: '2026-07-25' }),

    lead({ id: 'l-cane', business: 'Cane Row Coffee', contact: 'Andre Griffith', email: 'andre@canerowcoffee.bb',
      phone: '(246) 555-0177', industry: 'Food brand', source: 'Referral', value: 6800,
      stage: 'won', temp: 'hot', owner: 'sw', touched: '2026-07-15' }),
    lead({ id: 'l-meridian', business: 'Meridian Physio', contact: 'Camille Baptiste', email: 'camille@meridianphysio.jm',
      phone: '(876) 555-0163', industry: 'Healthcare', source: 'Website', value: 9400,
      stage: 'won', temp: 'warm', owner: 'sc', touched: '2026-07-08' })
  ];

  /* ------------------------------- nurture --------------------------------- */
  var channels = [
    { id: 'email', label: 'Email', icon: 'inbox', sent: 1840, rate: 41.2, rateLabel: 'Open rate' },
    { id: 'sms', label: 'SMS', icon: 'ticket', sent: 612, rate: 27.8, rateLabel: 'Reply rate' },
    { id: 'social', label: 'Social', icon: 'globe', sent: 96, rate: 6.4, rateLabel: 'Engagement' }
  ];

  var campaigns = [
    { id: 'cm-1', name: 'Med spa — booking gap teardown', channel: 'email', audience: 'Med spa & salon leads',
      size: 148, sent: 148, open: 46.6, click: 12.8, replies: 9, status: 'Active', date: '2026-07-21',
      subject: 'The 3 bookings you lost last week (and why)',
      body: 'Hi {{first_name}},\n\nMost salons we audit lose 3–5 bookings a week to a form nobody answers after 6pm.\n\nI pulled a short teardown of what that looks like for a studio the size of {{business}} — happy to send it over.\n\n— Sheneska' },
    { id: 'cm-2', name: 'Referral nudge — Q3', channel: 'email', audience: 'Active clients',
      size: 12, sent: 12, open: 83.3, click: 41.7, replies: 5, status: 'Active', date: '2026-07-14',
      subject: 'Know anyone drowning in admin?',
      body: 'Hi {{first_name}},\n\nQuick one — we have room for two more builds this quarter.\n\nIf anyone in your circle is still running {{business}}-sized operations out of a DM inbox, send them my way.\n\n— Sheneska' },
    { id: 'cm-3', name: 'Overdue invoice reminder', channel: 'sms', audience: 'Overdue accounts',
      size: 2, sent: 2, open: 100, click: 0, replies: 2, status: 'Active', date: '2026-07-26',
      subject: '', body: 'Hi {{first_name}} — invoice for {{business}} is past due. Pay here: bixllc.net/pay — Bix LLC' },
    { id: 'cm-4', name: 'Healthcare intake automation', channel: 'email', audience: 'Healthcare leads',
      size: 64, sent: 64, open: 38.1, click: 9.4, replies: 4, status: 'Active', date: '2026-07-07',
      subject: 'Your front desk is doing software\'s job',
      body: 'Hi {{first_name}},\n\nEvery practice we onboard has the same bottleneck: intake forms on paper, reminders by hand.\n\nWe automated it for two clinics this quarter. Want the numbers?\n\n— Sheneska' },
    { id: 'cm-5', name: 'Dormant leads — 90 day', channel: 'email', audience: 'Cold leads',
      size: 210, sent: 0, open: 0, click: 0, replies: 0, status: 'Draft', date: '2026-07-28',
      subject: 'Still running it manually?',
      body: 'Hi {{first_name}},\n\nWe spoke a while back about {{business}}. Circumstances change — worth another look?\n\n— Sheneska' },
    { id: 'cm-6', name: 'Spring launch announcement', channel: 'email', audience: 'All contacts',
      size: 386, sent: 386, open: 34.7, click: 7.1, replies: 11, status: 'Archived', date: '2026-04-18',
      subject: 'We build the thing behind the website now',
      body: 'Hi {{first_name}},\n\nBix has always built sites. This year we started building the systems behind them.\n\nHere is what that means for {{business}}.\n\n— Sheneska' }
  ];

  var sequences = [
    { id: 'sq-1', name: 'New enquiry → discovery call', status: 'Active', enrolled: 23, steps: [
      { day: 0, channel: 'email', title: 'Thanks — here is what happens next' },
      { day: 1, channel: 'email', title: 'A teardown of your current flow' },
      { day: 3, channel: 'sms', title: 'Quick nudge to book' },
      { day: 7, channel: 'email', title: 'Case study + calendar link' }
    ] },
    { id: 'sq-2', name: 'Proposal follow-up', status: 'Active', enrolled: 4, steps: [
      { day: 0, channel: 'email', title: 'Proposal delivered' },
      { day: 2, channel: 'email', title: 'Anything unclear in the scope?' },
      { day: 5, channel: 'sms', title: 'Checking in before it expires' }
    ] },
    { id: 'sq-3', name: 'Post-launch check-in', status: 'Active', enrolled: 9, steps: [
      { day: 7, channel: 'email', title: 'First week — how is it running?' },
      { day: 30, channel: 'email', title: 'Month one numbers' },
      { day: 90, channel: 'email', title: 'Quarter review + what is next' }
    ] },
    { id: 'sq-4', name: 'Dormant lead revival', status: 'Paused', enrolled: 0, steps: [
      { day: 0, channel: 'email', title: 'Still running it manually?' },
      { day: 6, channel: 'email', title: 'What changed since we spoke' }
    ] }
  ];

  var templates = [
    { id: 'tp-1', name: 'Discovery call follow-up', category: 'Sales', accent: 'purple',
      desc: 'Recap what they said, restate the problem in their words, propose next step.',
      subject: 'Recap — what I heard on our call',
      body: 'Hi {{first_name}},\n\nGood speaking with you. Here is what I heard:\n\n• The problem\n• What it is costing {{business}}\n• What we would build first\n\nIf that lands right, I will put a scope together.\n\n— Sheneska' },
    { id: 'tp-2', name: 'Proposal delivery', category: 'Sales', accent: 'blue',
      desc: 'Send the scope with a clear price, timeline and single decision point.',
      subject: 'Your build scope — {{business}}',
      body: 'Hi {{first_name}},\n\nScope attached. Three things to look at: what is included, what it costs, when it ships.\n\nOne decision from you and we start.\n\n— Sheneska' },
    { id: 'tp-3', name: 'Invoice reminder', category: 'Billing', accent: 'amber',
      desc: 'Firm, friendly, no apology. Links straight to payment.',
      subject: 'Invoice for {{business}} is due',
      body: 'Hi {{first_name}},\n\nQuick reminder that the current invoice for {{business}} is due.\n\nYou can settle it from the portal any time.\n\n— Bix LLC' },
    { id: 'tp-4', name: 'Overdue escalation', category: 'Billing', accent: 'red',
      desc: 'Second notice. States the pause policy without threatening.',
      subject: 'Second notice — {{business}}',
      body: 'Hi {{first_name}},\n\nThis one is past due. We pause active work at 30 days, so I would rather sort it now.\n\nAnything blocking payment on your side?\n\n— Sheneska' },
    { id: 'tp-5', name: 'Welcome & onboarding', category: 'Delivery', accent: 'green',
      desc: 'Sets expectations for week one and points at the portal.',
      subject: 'Welcome to Bix, {{first_name}}',
      body: 'Hi {{first_name}},\n\nYour portal is live. Everything about {{business}} — progress, files, invoices — lives there.\n\nWeek one is discovery. I will send times shortly.\n\n— Sheneska' },
    { id: 'tp-6', name: 'Monthly progress note', category: 'Delivery', accent: 'purple',
      desc: 'What shipped, what is next, what you need from them.',
      subject: '{{business}} — this month',
      body: 'Hi {{first_name}},\n\nShipped this month:\n•\n\nNext up:\n•\n\nNeed from you:\n•\n\n— Sheneska' },
    { id: 'tp-7', name: 'Referral ask', category: 'Growth', accent: 'blue',
      desc: 'Ask once, make it specific, make it easy to forward.',
      subject: 'A small favour',
      body: 'Hi {{first_name}},\n\n{{business}} has been a good one to build. If you know someone in the same spot you were in six months ago, forward this along.\n\n— Sheneska' },
    { id: 'tp-8', name: 'Re-engagement', category: 'Growth', accent: 'amber',
      desc: 'For leads that went quiet after a proposal.',
      subject: 'Closing the file on this?',
      body: 'Hi {{first_name}},\n\nHaven\'t heard back on the {{business}} scope — happy to close the file, no hard feelings.\n\nJust say the word either way.\n\n— Sheneska' }
  ];

  /* ------------------------------- invoices -------------------------------- */
  function inv(id, client, descr, amount, due, status, paid) {
    return { id: id, client: client, descr: descr, amount: amount, due: due, status: status, paid: paid || null };
  }
  var invoices = [
    inv('INV-2043', 'Serene Skin Studio', 'Growth Care — August retainer', 340, '2026-08-08', 'Outstanding'),
    inv('INV-2042', 'Ironwood Strength Co.', 'Member portal — phase 2 milestone', 1850, '2026-07-24', 'Overdue'),
    inv('INV-2041', 'Villa & Vine Realty', 'Growth Care — July retainer', 340, '2026-07-12', 'Paid', '2026-07-11'),
    inv('INV-2040', 'Bright Steps Pediatrics', 'Intake automation — build', 2400, '2026-08-12', 'Outstanding'),
    inv('INV-2039', 'Coral & Clay Boutique', 'Essential — July retainer', 180, '2026-07-10', 'Paid', '2026-07-08'),
    inv('INV-2038', 'Pepperpot Foods', 'Wholesale ordering — phase 1', 3200, '2026-07-19', 'Overdue'),
    inv('INV-2037', 'Northline Dental', 'Growth Care — July retainer', 340, '2026-07-14', 'Paid', '2026-07-13'),
    inv('INV-2036', 'Harbour Point Rentals', 'Booking engine rebuild — deposit', 4100, '2026-08-02', 'Outstanding'),
    inv('INV-2035', 'Studio Ré Hair Lab', 'Essential — July retainer', 180, '2026-07-09', 'Paid', '2026-07-09'),
    inv('INV-2034', 'Bloom & Barrow Florals', 'Seasonal storefront refresh', 1250, '2026-06-28', 'Paid', '2026-06-26'),
    inv('INV-2033', 'Cane Row Coffee', 'Discovery & scoping', 950, '2026-08-05', 'Outstanding'),
    inv('INV-2032', 'Meridian Physio', 'Practice site — build deposit', 2800, '2026-07-30', 'Outstanding'),
    inv('INV-2031', 'Ironwood Strength Co.', 'Scale — July retainer', 620, '2026-07-06', 'Paid', '2026-07-06'),
    inv('INV-2030', 'Bright Steps Pediatrics', 'Scale — July retainer', 620, '2026-07-07', 'Paid', '2026-07-07'),
    inv('INV-2029', 'Harbour Point Rentals', 'Scale — July retainer', 620, '2026-07-05', 'Paid', '2026-07-05'),
    inv('INV-2028', 'Pepperpot Foods', 'Growth Care — July retainer', 340, '2026-07-11', 'Paid', '2026-07-11'),
    inv('INV-2027', 'Bloom & Barrow Florals', 'Essential — July retainer', 180, '2026-07-15', 'Paid', '2026-07-15'),
    inv('INV-2026', 'Cane Row Coffee', 'Growth Care — July retainer', 340, '2026-07-16', 'Paid', '2026-07-16')
  ];

  /* ------------------------------- projects -------------------------------- */
  var phases = ['Discovery', 'Design', 'Build', 'QA', 'Launched'];
  var projects = [
    { id: 'p-1', client: 'Serene Skin Studio', title: 'Booking site & client system', phase: 'QA',
      percent: 78, due: '2026-08-14', team: ['at', 'tb'],
      checklist: [['Loyalty flow', true], ['Rebooking prompts', true], ['Speed pass', false], ['Handover doc', false]],
      notes: 'Loyalty ladder signed off. Speed pass is the last blocker before launch.' },
    { id: 'p-2', client: 'Ironwood Strength Co.', title: 'Member portal — phase 2', phase: 'Build',
      percent: 61, due: '2026-09-04', team: ['at', 'sc'],
      checklist: [['Class booking', true], ['Payment holds', true], ['Coach dashboard', false], ['Mobile pass', false]],
      notes: 'Coach dashboard scope grew — flagged with Marcus, may need a change order.' },
    { id: 'p-3', client: 'Bright Steps Pediatrics', title: 'Intake & reminder automation', phase: 'Build',
      percent: 44, due: '2026-07-24', team: ['at', 'tb', 'sc'],
      checklist: [['Digital intake', true], ['SMS reminders', false], ['EHR handoff', false]],
      notes: 'Waiting on their EHR vendor for API credentials. Slipped past due because of it.' },
    { id: 'p-4', client: 'Pepperpot Foods', title: 'Wholesale ordering portal', phase: 'Design',
      percent: 35, due: '2026-09-18', team: ['tb'],
      checklist: [['Price tiers', true], ['Order flow', false], ['Invoicing hook', false]],
      notes: 'Devon has been slow on the price-tier sheet. Health dropping — worth a call.' },
    { id: 'p-5', client: 'Harbour Point Rentals', title: 'Booking engine rebuild', phase: 'Build',
      percent: 53, due: '2026-08-29', team: ['at', 'tb'],
      checklist: [['Availability sync', true], ['Deposit capture', true], ['Channel manager', false]],
      notes: 'Channel manager integration is the long pole. On track otherwise.' },
    { id: 'p-6', client: 'Northline Dental', title: 'Recall campaign build', phase: 'QA',
      percent: 82, due: '2026-08-08', team: ['tb', 'sc'],
      checklist: [['Recall segments', true], ['Message set', true], ['Reporting', false]],
      notes: 'Reporting view left. Paul wants it before he signs off.' },
    { id: 'p-7', client: 'Cane Row Coffee', title: 'Subscription storefront', phase: 'Discovery',
      percent: 18, due: '2026-10-02', team: ['sw', 'tb'],
      checklist: [['Kickoff', true], ['Subscription model', false], ['Fulfilment flow', false]],
      notes: 'Fresh signing. Kickoff done, working through the subscription tiers.' },
    { id: 'p-8', client: 'Meridian Physio', title: 'Practice site & intake', phase: 'Discovery',
      percent: 12, due: '2026-10-16', team: ['sw', 'at'],
      checklist: [['Kickoff', true], ['Service map', false], ['Intake spec', false]],
      notes: 'Signed 8 July. Service map workshop booked for next week.' },
    { id: 'p-9', client: 'Villa & Vine Realty', title: 'Listing syndication', phase: 'Launched',
      percent: 100, due: '2026-06-20', team: ['at'],
      checklist: [['Feed build', true], ['Portal push', true], ['Monitoring', true]],
      notes: 'Live since June. Running clean.' },
    { id: 'p-10', client: 'Studio Ré Hair Lab', title: 'Site & booking refresh', phase: 'Launched',
      percent: 100, due: '2026-06-30', team: ['tb'],
      checklist: [['Rebuild', true], ['Booking swap', true], ['Training', true]],
      notes: 'Launched end of June. Rae trained on the admin.' }
  ];

  /* ------------------------------- meetings -------------------------------- */
  var meetings = [
    { id: 'm-1', title: 'Loyalty flow walkthrough', type: 'Check-in', on: '2026-07-29', at: '10:30', mins: 45,
      who: 'Kadeen Morgan · Serene Skin Studio', link: 'https://meet.google.com/bix-serene-loyalty' },
    { id: 'm-2', title: 'Northgate proposal review', type: 'Sales', on: '2026-07-29', at: '14:00', mins: 30,
      who: 'Curtis Fenton · Northgate Realty', link: 'https://meet.google.com/bix-northgate' },
    { id: 'm-3', title: 'Weekly build sync', type: 'Internal', on: '2026-07-29', at: '16:30', mins: 30,
      who: 'Andre, Tameka, Shanice', link: '' },
    { id: 'm-4', title: 'Arbor Lane discovery', type: 'Discovery', on: '2026-07-30', at: '11:00', mins: 45,
      who: 'Dr. Hannah Reyes · Arbor Lane Dental', link: 'https://meet.google.com/bix-arbor' },
    { id: 'm-5', title: 'Meridian service map workshop', type: 'Discovery', on: '2026-08-04', at: '09:30', mins: 60,
      who: 'Camille Baptiste · Meridian Physio', link: 'https://meet.google.com/bix-meridian' },
    { id: 'm-6', title: 'Marigold scope call', type: 'Sales', on: '2026-08-05', at: '13:00', mins: 30,
      who: 'Ayanna Bramble · Marigold Events', link: 'https://meet.google.com/bix-marigold' },
    { id: 'm-7', title: 'Pepperpot check-in', type: 'Check-in', on: '2026-08-06', at: '15:00', mins: 30,
      who: 'Devon Ramkissoon · Pepperpot Foods', link: '' },
    { id: 'm-8', title: 'Cane Row kickoff', type: 'Discovery', on: '2026-07-16', at: '10:00', mins: 60,
      who: 'Andre Griffith · Cane Row Coffee', link: '' },
    { id: 'm-9', title: 'July performance review', type: 'Check-in', on: '2026-07-20', at: '14:00', mins: 30,
      who: 'Kadeen Morgan · Serene Skin Studio', link: '' },
    { id: 'm-10', title: 'Harbour Point build sync', type: 'Internal', on: '2026-08-11', at: '11:30', mins: 30,
      who: 'Andre, Tameka', link: '' }
  ];

  /* ------------------------------- activity -------------------------------- */
  var activity = [
    { at: '2026-07-29T08:40:00', who: 'Shanice Campbell', what: 'moved <b>Marigold Events Co.</b> to Proposal' },
    { at: '2026-07-28T17:05:00', who: 'System', what: 'captured lead <b>Calabash Bistro</b> from Instagram' },
    { at: '2026-07-28T14:20:00', who: 'Sheneska Williams', what: 'sent proposal to <b>Northgate Realty Group</b>' },
    { at: '2026-07-27T11:10:00', who: 'Andre Thompson', what: 'shipped <b>deposit capture</b> on Harbour Point' },
    { at: '2026-07-26T16:45:00', who: 'System', what: 'invoice <b>INV-2042</b> went overdue' },
    { at: '2026-07-26T09:30:00', who: 'Sheneska Williams', what: 'qualified <b>Arbor Lane Dental</b>' },
    { at: '2026-07-24T15:00:00', who: 'Tameka Bailey', what: 'delivered <b>recall message set</b> for Northline Dental' },
    { at: '2026-07-21T10:15:00', who: 'Sheneska Williams', what: 'launched campaign <b>Med spa — booking gap teardown</b>' },
    { at: '2026-07-16T12:00:00', who: 'Sheneska Williams', what: 'signed <b>Cane Row Coffee</b>' },
    { at: '2026-07-15T09:00:00', who: 'Shanice Campbell', what: 'closed <b>Cane Row Coffee</b> as Won' },
    { at: '2026-07-11T13:25:00', who: 'System', what: 'payment received for <b>INV-2041</b>' },
    { at: '2026-07-08T10:00:00', who: 'Sheneska Williams', what: 'signed <b>Meridian Physio</b>' }
  ];

  var notifications = [
    { id: 'n-1', unread: true, what: 'INV-2042 is 5 days overdue', when: '2026-07-29', go: 'revenue' },
    { id: 'n-2', unread: true, what: 'Bright Steps Pediatrics build is past due', when: '2026-07-28', go: 'projects' },
    { id: 'n-3', unread: true, what: '4 new leads captured this week', when: '2026-07-28', go: 'leads' },
    { id: 'n-4', unread: false, what: 'Pepperpot Foods health dropped to 58', when: '2026-07-25', go: 'clients' }
  ];

  /* 12-month revenue history, oldest first. July is the live month. */
  var revenue = [
    { m: 'Aug', y: 2025, total: 2180 }, { m: 'Sep', y: 2025, total: 2460 },
    { m: 'Oct', y: 2025, total: 2790 }, { m: 'Nov', y: 2025, total: 3120 },
    { m: 'Dec', y: 2025, total: 2980 }, { m: 'Jan', y: 2026, total: 3340 },
    { m: 'Feb', y: 2026, total: 3610 }, { m: 'Mar', y: 2026, total: 3880 },
    { m: 'Apr', y: 2026, total: 4260 }, { m: 'May', y: 2026, total: 4490 },
    { m: 'Jun', y: 2026, total: 4820 }, { m: 'Jul', y: 2026, total: 5310 }
  ];

  /* 30-day funnel. Counts must descend — the view trusts that for its widths. */
  var funnel = [
    { stage: 'Leads captured', count: 68 },
    { stage: 'Contacted', count: 41 },
    { stage: 'Qualified', count: 24 },
    { stage: 'Proposal', count: 13 },
    { stage: 'Won', count: 7 }
  ];

  /* ============================ derived totals ==============================
     Computed, never typed. If a client or invoice is edited at runtime the
     dashboard follows automatically. */
  function sum(list, key) {
    return list.reduce(function (a, x) { return a + Number(x[key] || 0); }, 0);
  }

  function recompute(d) {
    var paying = d.clients.filter(function (c) { return c.status !== 'Paused'; });
    var open = d.leads.filter(function (l) { return l.stage !== 'won'; });
    var owing = d.invoices.filter(function (i) { return i.status === 'Outstanding' || i.status === 'Overdue'; });
    var overdue = d.invoices.filter(function (i) { return i.status === 'Overdue'; });
    var month = TODAY.slice(0, 7);
    var collected = d.invoices.filter(function (i) { return i.status === 'Paid' && i.paid && i.paid.slice(0, 7) === month; });
    var wonThisMonth = d.leads.filter(function (l) { return l.stage === 'won' && l.touched.slice(0, 7) === month; });

    d.totals = {
      mrr: sum(paying, 'mrr'),
      activeClients: paying.length,
      openLeads: open.length,
      pipeline: sum(open, 'value'),
      outstanding: sum(owing, 'amount'),
      overdueCount: overdue.length,
      collected: sum(collected, 'amount'),
      wonThisMonth: wonThisMonth.length,
      wonValue: sum(wonThisMonth, 'value'),
      avgDeal: open.length ? Math.round(sum(open, 'value') / open.length) : 0,
      avgHealth: paying.length ? Math.round(sum(paying, 'health') / paying.length) : 0,
      churnRisk: d.clients.filter(function (c) { return c.health < 60 || c.status === 'At risk'; }).length,
      activeBuilds: d.projects.filter(function (p) { return p.phase !== 'Launched'; }).length,
      overdueBuilds: d.projects.filter(function (p) { return p.phase !== 'Launched' && p.due < TODAY; }).length,
      launchingThisMonth: d.projects.filter(function (p) {
        return p.phase !== 'Launched' && p.due.slice(0, 7) === month;
      }).length
    };
    return d.totals;
  }

  BIX.data = {
    today: TODAY,
    agency: { name: 'Bix LLC', founder: 'Sheneska Williams', email: 'admin@bixllc.net', timezone: 'America/Chicago' },
    team: team,
    clients: clients,
    stages: stages,
    leads: leads,
    channels: channels,
    campaigns: campaigns,
    sequences: sequences,
    templates: templates,
    projects: projects,
    phases: phases,
    invoices: invoices,
    meetings: meetings,
    activity: activity,
    notifications: notifications,
    revenue: revenue,
    funnel: funnel,
    /* month-over-month deltas, in percent */
    deltas: { mrr: 10.2, clients: 18.2, leads: 33.3, pipeline: 21.4, outstanding: -8.6 }
  };

  BIX.recompute = function () { return recompute(BIX.data); };
  recompute(BIX.data);
})();
