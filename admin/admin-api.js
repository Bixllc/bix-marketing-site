/* ==========================================================================
   admin-api.js — real Supabase data behind the console.

   Loads into exactly the BIX.data shape the views already expect, so no view
   file knows whether it is reading a database or a fixture. Replaces
   admin-data.js; the derived totals are recomputed here after every write.
   ========================================================================== */
/* This file loads before admin-app.js, so it cannot assume the namespace
   already exists — admin-data.js used to create it and no longer does. */
window.BIX = window.BIX || {};

(function () {
  'use strict';

  var sb = window.BixAuth.sb;

  /* Static vocabulary — not content, so it lives in code rather than a table. */
  var STAGES = [
    { id: 'new', name: 'New', color: '#968FA3' },
    { id: 'contacted', name: 'Contacted', color: '#2E89E6' },
    { id: 'qualified', name: 'Qualified', color: '#B5810F' },
    { id: 'proposal', name: 'Proposal', color: '#5B2A83' },
    { id: 'won', name: 'Won', color: '#1E8A5E' }
  ];
  var CHANNELS = [
    { id: 'email', label: 'Email', icon: 'inbox', sent: 0, rate: 0, rateLabel: 'Open rate' },
    { id: 'sms', label: 'SMS', icon: 'ticket', sent: 0, rate: 0, rateLabel: 'Reply rate' },
    { id: 'social', label: 'Social', icon: 'globe', sent: 0, rate: 0, rateLabel: 'Engagement' }
  ];
  var PHASES = ['Discovery', 'Design', 'Build', 'QA', 'Launched'];

  /* projects.status uses a constrained vocabulary; the board groups by the
     friendlier phase names. One mapping, used both ways. */
  var STATUS_TO_PHASE = {
    discovery: 'Discovery', design: 'Design', development: 'Build',
    review: 'QA', launched: 'Launched'
  };

  function today() { return new Date().toISOString().slice(0, 10); }
  function iso(v) { return v ? String(v).slice(0, 10) : null; }
  function num(v) { return Number(v || 0); }
  function monthOf(v) { return v ? String(v).slice(0, 7) : ''; }

  function shiftMonth(ym, n) {
    var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + n;
    var d = new Date(Date.UTC(y, m, 1));
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }

  /* One round trip per table. A failed table resolves to [] so one missing
     grant degrades that section to its empty state instead of blanking the
     whole console. */
  function all(q) {
    return q.then(function (r) {
      if (r.error) { console.warn('[admin-api]', r.error.message); return []; }
      return r.data || [];
    });
  }

  var api = {
    user: null,
    role: null,

    /* ------------------------------- load -------------------------------- */
    load: function () {
      return sb.auth.getSession().then(function (s) {
        var u = s.data && s.data.session && s.data.session.user;
        if (!u) return { fatal: 'no-session' };
        api.user = u;

        return sb.from('profiles').select('role, full_name, email').eq('id', u.id).single()
          .then(function (p) {
            api.role = (p.data && p.data.role) || 'client';
            if (api.role !== 'admin') return { fatal: 'not-admin' };
            api.me = p.data || {};
            return api.reload().then(function () { return { ok: true }; });
          });
      });
    },

    reload: function () {
      return Promise.all([
        all(sb.from('profiles').select('*').eq('role', 'client')),
        all(sb.from('projects').select('*')),
        all(sb.from('phases').select('*').order('position')),
        all(sb.from('invoices').select('*').order('due', { ascending: false })),
        all(sb.from('meetings').select('*')),
        all(sb.from('leads').select('*').order('touched', { ascending: false })),
        all(sb.from('lead_notes').select('*').order('created_at', { ascending: false })),
        all(sb.from('lead_events').select('*').order('created_at', { ascending: false })),
        all(sb.from('campaigns').select('*').order('sent_on', { ascending: false })),
        all(sb.from('sequences').select('*')),
        all(sb.from('sequence_steps').select('*').order('position')),
        all(sb.from('templates').select('*').order('name')),
        all(sb.from('team').select('*')),
        all(sb.from('agency_events').select('*').order('created_at', { ascending: false }).limit(30))
      ]).then(function (r) {
        shape({
          profiles: r[0], projects: r[1], phases: r[2], invoices: r[3], meetings: r[4],
          leads: r[5], notes: r[6], events: r[7], campaigns: r[8], sequences: r[9],
          steps: r[10], templates: r[11], team: r[12], feed: r[13]
        });
        return BIX.data;
      });
    },

    /* ------------------------------ writes ------------------------------- */

    /* Onboarding runs through the Edge Function: creating an auth user needs
       the service-role key, which must never reach the browser. */
    /* The Authorization header is set explicitly: functions.invoke otherwise
       sends the anon key, which carries no user, and the function's admin
       check then rejects every call as an invalid session. */
    inviteClient: function (fields) {
      return sb.auth.getSession().then(function (s) {
        var token = s.data && s.data.session && s.data.session.access_token;
        if (!token) return { error: { message: 'Session expired — sign in again' } };

        return sb.functions.invoke('invite-client', {
          body: fields,
          headers: { Authorization: 'Bearer ' + token }
        })
        .then(function (r) {
          if (!r.error) return { data: r.data };
          /* A non-2xx arrives as FunctionsHttpError with the Response on
             .context; the useful message is in its JSON body, not .message. */
          var ctx = r.error.context;
          if (ctx && typeof ctx.json === 'function') {
            return ctx.json().then(function (b) {
              return { error: { message: b.error || r.error.message, already: !!b.already } };
            }, function () {
              return { error: { message: r.error.message } };
            });
          }
          return { error: { message: r.error.message } };
        });
      });
    },

    /* Billing is always a deliberate action from the console — there is no
       schedule. Every call names its action, and { dry: true } reports intent
       without sending or writing anything. */
    billing: function (payload) {
      return sb.auth.getSession().then(function (s) {
        var token = s.data && s.data.session && s.data.session.access_token;
        if (!token) return { error: { message: 'Session expired — sign in again' } };
        return sb.functions.invoke('run-billing', {
          body: payload, headers: { Authorization: 'Bearer ' + token }
        }).then(function (r) {
          if (!r.error) return { data: r.data };
          var ctx = r.error.context;
          if (ctx && typeof ctx.json === 'function') {
            return ctx.json().then(function (b) {
              return { error: { message: b.error || r.error.message } };
            }, function () { return { error: { message: r.error.message } }; });
          }
          return { error: { message: r.error.message } };
        });
      });
    },

    updateClient: function (id, patch) {
      return sb.from('profiles').update(patch).eq('id', id).select().single();
    },

    /* Internal notes are fetched per client rather than loaded up front —
       they are only ever read inside one client's detail. */
    listNotes: function (clientId) {
      return sb.from('client_notes').select('*').eq('client_id', clientId)
        .order('created_at', { ascending: false });
    },
    addNote: function (clientId, author, body) {
      return sb.from('client_notes')
        .insert({ client_id: clientId, author: author, body: body }).select().single();
    },
    deleteNote: function (id) { return sb.from('client_notes').delete().eq('id', id); },

    createProject: function (row) { return sb.from('projects').insert(row).select().single(); },
    deleteProject: function (id) { return sb.from('projects').delete().eq('id', id); },

    createLead: function (row) { return sb.from('leads').insert(row).select().single(); },
    updateLead: function (id, patch) { return sb.from('leads').update(patch).eq('id', id).select().single(); },
    deleteLead: function (id) { return sb.from('leads').delete().eq('id', id); },
    addLeadNote: function (leadId, author, body) {
      return sb.from('lead_notes').insert({ lead_id: leadId, author: author, body: body }).select().single();
    },
    addLeadEvent: function (leadId, what) {
      return sb.from('lead_events').insert({ lead_id: leadId, what: what }).select().single();
    },

    createInvoice: function (row) { return sb.from('invoices').insert(row).select().single(); },
    updateInvoice: function (id, patch) { return sb.from('invoices').update(patch).eq('id', id).select().single(); },

    createMeeting: function (row) { return sb.from('meetings').insert(row).select().single(); },

    setPhaseState: function (id, state) {
      return sb.from('phases').update({ state: state }).eq('id', id).select().single();
    },
    updateProject: function (id, patch) {
      return sb.from('projects').update(patch).eq('id', id).select().single();
    },

    addTeam: function (row) { return sb.from('team').insert(row).select().single(); },
    removeTeam: function (id) { return sb.from('team').delete().eq('id', id); },

    /* Internal feed. Fire-and-forget: an event failing to record must never
       block the action that produced it. */
    log: function (action) {
      var actor = (api.me && api.me.full_name) || 'Bix';
      sb.from('agency_events').insert({ actor: actor, action: action }).then(function () {}, function () {});
      if (BIX.data && BIX.data.activity) {
        BIX.data.activity.unshift({ at: new Date().toISOString(), who: actor, what: action });
      }
    },

    signOut: function () {
      return sb.auth.signOut().then(function () { location.href = '../login.html'; });
    }
  };

  /* --------------------------- shape into BIX.data ------------------------ */
  function shape(raw) {
    var t = today();

    var projByClient = {};
    raw.projects.forEach(function (p) {
      if (!projByClient[p.client_id]) projByClient[p.client_id] = p;
    });

    var clients = raw.profiles.map(function (p) {
      var proj = projByClient[p.id];
      return {
        id: p.id,
        business: p.business || p.company || p.full_name || 'Unnamed client',
        industry: p.industry || '—',
        contact: p.full_name || '—',
        email: p.email || '—',
        phone: p.phone || '—',
        location: p.address || '—',
        plan: p.plan || 'Growth Care',
        mrr: num(p.plan_price),
        status: p.status || 'Active',
        website: p.website || null,
        phone: p.phone || '—',
        nextBilling: iso(p.next_billing),
        since: iso(p.created_at) || t,
        project: proj ? proj.name : 'Onboarding',
        percent: proj ? num(proj.progress) : 0
      };
    });
    var nameOf = {};
    clients.forEach(function (c) { nameOf[c.id] = c.business; });

    var phasesByProject = {};
    raw.phases.forEach(function (ph) {
      (phasesByProject[ph.project_id] = phasesByProject[ph.project_id] || []).push(ph);
    });

    var projects = raw.projects.map(function (p) {
      var list = phasesByProject[p.id] || [];
      return {
        id: p.id,
        client: nameOf[p.client_id] || '—',
        title: p.name,
        phase: STATUS_TO_PHASE[String(p.status || '').toLowerCase()] || p.phase || 'Discovery',
        percent: num(p.progress),
        due: iso(p.due) || iso(p.launched) || t,
        team: [],
        /* [label, done] pairs, carrying the phase row id so a tick can write
           back to the right row. */
        checklist: list.map(function (ph) { return [ph.name, ph.state === 'done', ph.id]; }),
        notes: p.summary || ''
      };
    });

    var invoices = raw.invoices.map(function (i) {
      return {
        id: i.number || i.id,
        rowId: i.id,
        client: nameOf[i.client_id] || '—',
        clientId: i.client_id,
        descr: i.descr || '',
        amount: num(i.amount),
        due: iso(i.due) || t,
        status: i.status || 'Outstanding',
        paid: i.status === 'Paid' ? (iso(i.paid_on) || iso(i.issued)) : null
      };
    });

    var notesByLead = {};
    raw.notes.forEach(function (n) {
      (notesByLead[n.lead_id] = notesByLead[n.lead_id] || []).push({
        at: iso(n.created_at), by: n.author || 'Bix', body: n.body || ''
      });
    });
    var eventsByLead = {};
    raw.events.forEach(function (e) {
      (eventsByLead[e.lead_id] = eventsByLead[e.lead_id] || []).push({
        at: iso(e.created_at), what: e.what || ''
      });
    });

    var leads = raw.leads.map(function (l) {
      return {
        id: l.id, business: l.business, contact: l.contact || '—',
        email: l.email || '—', phone: l.phone || '—',
        industry: l.industry || '—', source: l.source || 'Direct',
        value: num(l.value), stage: l.stage || 'new', temp: l.temp || 'warm',
        owner: l.owner || 'sw', touched: iso(l.touched) || t,
        created: iso(l.created_at) || t,
        notes: notesByLead[l.id] || [],
        log: eventsByLead[l.id] || [{ at: iso(l.created_at) || t, what: 'Lead created' }]
      };
    });

    var stepsBySeq = {};
    raw.steps.forEach(function (s) {
      (stepsBySeq[s.sequence_id] = stepsBySeq[s.sequence_id] || []).push({
        day: num(s.day), channel: s.channel || 'email', title: s.title || ''
      });
    });

    var team = raw.team.length ? raw.team.map(function (m) {
      return { id: m.id, name: m.name, role: m.role || 'Team', email: m.email || '—', initials: m.initials || initials(m.name) };
    }) : [{ id: 'sw', name: (api.me && api.me.full_name) || 'Bix', role: 'Founder', email: (api.me && api.me.email) || '', initials: 'SW' }];

    var campaigns = raw.campaigns.map(function (c) {
      return {
        id: c.id, name: c.name, channel: c.channel || 'email', audience: c.audience || '—',
        size: num(c.size), sent: num(c.sent), open: num(c.open_rate), click: num(c.click_rate),
        replies: num(c.replies), status: c.status || 'Draft',
        date: iso(c.sent_on) || iso(c.created_at) || t,
        subject: c.subject || '', body: c.body || ''
      };
    });

    /* Channel totals are the sum of what actually went out, not a stored
       figure that could drift from the campaign rows under it. */
    var channels = CHANNELS.map(function (ch) {
      var mine = campaigns.filter(function (c) { return c.channel === ch.id && c.sent; });
      var sent = mine.reduce(function (a, c) { return a + c.sent; }, 0);
      var rate = mine.length ? mine.reduce(function (a, c) { return a + c.open; }, 0) / mine.length : 0;
      return { id: ch.id, label: ch.label, icon: ch.icon, sent: sent, rate: rate, rateLabel: ch.rateLabel };
    });

    BIX.data = {
      today: t,
      agency: {
        name: 'Bix LLC',
        founder: (api.me && api.me.full_name) || 'Bix',
        email: (api.me && api.me.email) || 'admin@bixllc.net',
        timezone: 'America/Chicago'
      },
      team: team,
      clients: clients,
      stages: STAGES,
      leads: leads,
      channels: channels,
      campaigns: campaigns,
      sequences: raw.sequences.map(function (s) {
        return { id: s.id, name: s.name, status: s.status || 'Active', enrolled: num(s.enrolled), steps: stepsBySeq[s.id] || [] };
      }),
      templates: raw.templates.map(function (x) {
        return { id: x.id, name: x.name, category: x.category || 'General', accent: x.accent || 'purple',
          desc: x.descr || '', subject: x.subject || '', body: x.body || '' };
      }),
      projects: projects,
      phases: PHASES,
      invoices: invoices,
      meetings: raw.meetings.map(function (m) {
        return {
          id: m.id, title: m.title, type: m.kind || 'Check-in',
          on: iso(m.meets_on) || t, at: m.meets_at || '09:00',
          mins: parseInt(m.duration, 10) || 30,
          who: m.client_id ? (nameOf[m.client_id] || '—') : (m.notes || 'Internal'),
          link: m.link || ''
        };
      }),
      activity: raw.feed.map(function (e) {
        return { at: e.created_at, who: e.actor || 'Bix', what: e.action || '' };
      }),
      notifications: [],
      revenue: [],
      funnel: [],
      deltas: {}
    };

    derive();
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  /* Everything below is computed from the rows above, so no figure on the
     dashboard can disagree with the table it links to. */
  function derive() {
    var d = BIX.data, t = d.today, thisMonth = monthOf(t);

    /* --- 12-month revenue from settled invoices --- */
    var series = [], ym = shiftMonth(thisMonth, -11);
    for (var i = 0; i < 12; i++) {
      var mTotal = d.invoices.filter(function (x) {
        return x.status === 'Paid' && monthOf(x.paid) === ym;
      }).reduce(function (a, x) { return a + x.amount; }, 0);
      var dt = new Date(ym + '-01T12:00:00');
      series.push({ m: dt.toLocaleDateString('en-US', { month: 'short' }), y: dt.getFullYear(), total: mTotal });
      ym = shiftMonth(ym, 1);
    }
    d.revenue = series;

    /* --- funnel: how far each lead from the last 30 days has travelled ---
       We store a lead's current stage, not its history, so "reached stage N"
       means "is at or past N". That descends monotonically by construction. */
    var cut = new Date(new Date(t + 'T12:00:00').getTime() - 30 * 86400000).toISOString().slice(0, 10);
    var recent = d.leads.filter(function (l) { return (l.created || l.touched) >= cut; });
    var order = ['new', 'contacted', 'qualified', 'proposal', 'won'];
    var labels = ['Leads captured', 'Contacted', 'Qualified', 'Proposal', 'Won'];
    d.funnel = order.map(function (s, idx) {
      return {
        stage: labels[idx],
        count: recent.filter(function (l) { return order.indexOf(l.stage) >= idx; }).length
      };
    });

    /* --- month-over-month deltas, only where there is a base to compare --- */
    var lastMonth = shiftMonth(thisMonth, -1);
    function pctChange(now, before) {
      if (!before) return null;
      return Math.round((now - before) / before * 1000) / 10;
    }
    var thisRev = series[11].total, lastRev = series[10].total;
    var newClients = d.clients.filter(function (c) { return monthOf(c.since) === thisMonth; }).length;
    var priorClients = d.clients.length - newClients;
    var leadsNow = d.leads.filter(function (l) { return monthOf(l.created) === thisMonth; }).length;
    var leadsPrev = d.leads.filter(function (l) { return monthOf(l.created) === lastMonth; }).length;

    d.deltas = {
      /* No MRR history is stored, so there is nothing honest to compare a
         recurring figure against. Comparing it to collected cash — which is
         what this used to do — describes a different number than the one it
         sits under. A missing delta renders as nothing at all. */
      mrr: null,
      /* Collected cash does have a prior month, and this is where that
         comparison actually belongs. */
      collected: pctChange(thisRev, lastRev),
      clients: pctChange(d.clients.length, priorClients),
      leads: pctChange(leadsNow, leadsPrev),
      pipeline: null,
      outstanding: null
    };

    BIX.recompute();

    /* --- notifications derived from the same rows --- */
    var n = [];
    d.invoices.filter(function (x) { return x.status === 'Overdue'; }).forEach(function (x) {
      n.push({ id: 'inv-' + x.id, unread: true, what: x.id + ' is overdue (' + x.client + ')', when: x.due, go: 'revenue' });
    });
    d.projects.filter(function (p) { return p.phase !== 'Launched' && p.due < t; }).forEach(function (p) {
      n.push({ id: 'prj-' + p.id, unread: true, what: p.client + ' build is past due', when: p.due, go: 'projects' });
    });
    var fresh = d.leads.filter(function (l) { return l.stage === 'new'; }).length;
    if (fresh) n.push({ id: 'lead-new', unread: true, what: fresh + ' new lead' + (fresh === 1 ? '' : 's') + ' waiting', when: t, go: 'leads' });
    d.notifications = n;
  }

  /* Totals. Kept identical to the mock build so the views are untouched. */
  BIX.recompute = function () {
    var d = BIX.data, t = d.today, month = monthOf(t);
    function sum(list, key) { return list.reduce(function (a, x) { return a + num(x[key]); }, 0); }

    /* Upcoming and Paused accounts are not billing yet, so counting them would
       overstate recurring revenue. They still appear in the clients list. */
    var paying = d.clients.filter(function (c) {
      return c.status !== 'Paused' && c.status !== 'Upcoming';
    });
    var open = d.leads.filter(function (l) { return l.stage !== 'won' && l.stage !== 'lost'; });
    var owing = d.invoices.filter(function (i) { return i.status === 'Outstanding' || i.status === 'Overdue'; });
    var collected = d.invoices.filter(function (i) { return i.status === 'Paid' && monthOf(i.paid) === month; });
    var won = d.leads.filter(function (l) { return l.stage === 'won' && monthOf(l.touched) === month; });

    d.totals = {
      mrr: sum(paying, 'mrr'),
      activeClients: paying.length,
      openLeads: open.length,
      pipeline: sum(open, 'value'),
      outstanding: sum(owing, 'amount'),
      overdueCount: d.invoices.filter(function (i) { return i.status === 'Overdue'; }).length,
      collected: sum(collected, 'amount'),
      wonThisMonth: won.length,
      wonValue: sum(won, 'value'),
      avgDeal: open.length ? Math.round(sum(open, 'value') / open.length) : 0,
      /* Health was a static column with a default — it ranked nothing. These
         two are computed from invoices, which is real. */
      overdueClients: (function () {
        var ids = {};
        d.invoices.filter(function (i) { return i.status === 'Overdue'; })
          .forEach(function (i) { ids[i.clientId] = 1; });
        return Object.keys(ids).length;
      })(),
      upcoming: d.clients.filter(function (c) { return c.status === 'Upcoming'; }).length,
      activeBuilds: d.projects.filter(function (p) { return p.phase !== 'Launched'; }).length,
      overdueBuilds: d.projects.filter(function (p) { return p.phase !== 'Launched' && p.due < t; }).length,
      launchingThisMonth: d.projects.filter(function (p) { return p.phase !== 'Launched' && monthOf(p.due) === month; }).length
    };
    return d.totals;
  };

  /* Reload from the database, then repaint the view and the sidebar badges. */
  BIX.refresh = function (toast) {
    return api.reload().then(function () {
      BIX.app.rerender();
      BIX.app.refreshChrome();
      if (toast) BIX.toast(toast);
    });
  };

  BIX.api = api;
})();
