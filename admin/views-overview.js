/* ==========================================================================
   views-overview.js — dashboard, clients, projects
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;
  BIX.actions = BIX.actions || {};

  /* Unique gradient id per ring: duplicated ids across several rings on one
     page are invalid, and the second ring would inherit the first's paint. */
  var ringN = 0;
  function ring(pct, caption, small) {
    var size = small ? 68 : 118, sw = small ? 7 : 9;
    var r = (size - sw) / 2 - 1, c = 2 * Math.PI * r, mid = size / 2;
    var gid = 'bxRingG' + (++ringN);
    return '<div class="bx-ring' + (small ? ' bx-ring--sm' : '') + '">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
        '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#442061"/><stop offset="100%" stop-color="#2E89E6"/>' +
        '</linearGradient></defs>' +
        '<circle cx="' + mid + '" cy="' + mid + '" r="' + r + '" fill="none" stroke="rgba(20,16,31,.09)" stroke-width="' + sw + '"/>' +
        '<circle class="bx-ring__c" cx="' + mid + '" cy="' + mid + '" r="' + r + '" fill="none" stroke="url(#' + gid + ')" ' +
          'stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c + '" ' +
          'stroke-dashoffset="' + c + '" data-off="' + (c - c * pct / 100) + '"/>' +
      '</svg>' +
      '<div class="bx-ring__mid"><div class="bx-ring__v">' + pct + '%</div>' +
      (caption ? '<div class="bx-ring__k">' + H.esc(caption) + '</div>' : '') + '</div></div>';
  }
  function animateRings(el) {
    el.querySelectorAll('.bx-ring__c').forEach(function (c) {
      /* Flush layout so the transition has a start frame, then set the end
         value. A rAF here stalls whenever the tab throttles frames. */
      void c.getBoundingClientRect();
      c.style.strokeDashoffset = c.getAttribute('data-off');
    });
  }
  BIX.ring = ring;
  BIX.animateRings = animateRings;

  function healthTone(h) { return h < 60 ? 'red' : h < 80 ? 'amber' : 'green'; }

  /* Inline meter used in the clients table and project cards. */
  function meter(pct, tone) {
    return '<span class="bx-meterline"><span class="bx-meterline__t">' +
      '<span class="bx-meterline__f' + (tone ? ' is-' + tone : '') + '" style="width:' + pct + '%"></span></span>' +
      '<span class="bx-mono bx-meterline__v">' + pct + '</span></span>';
  }

  /* ============================== DASHBOARD =============================== */
  BIX.views.dashboard = {
    wide: true,
    render: function () {
      var d = BIX.data, t = d.totals, k = d.deltas;

      var stats =
        H.stat({ k: 'MRR', v: BIX.money0(t.mrr), d: k.mrr, icon: 'money', tone: 'green' }) +
        H.stat({ k: 'Active clients', v: t.activeClients, d: k.clients, icon: 'users', tone: 'purple' }) +
        H.stat({ k: 'Open leads', v: t.openLeads, d: k.leads, icon: 'target', tone: 'blue' }) +
        H.stat({ k: 'Pipeline value', v: BIX.money0(t.pipeline), d: k.pipeline, icon: 'chart', tone: 'purple' }) +
        H.stat({ k: 'Outstanding', v: BIX.money0(t.outstanding), d: k.outstanding, icon: 'doc', tone: 'amber' });

      var acts = [
        { id: 'lead', icon: 'target', t: 'Add lead', s: 'Capture a new enquiry' },
        { id: 'invoice', icon: 'money', t: 'New invoice', s: 'Bill a client' },
        { id: 'meeting', icon: 'calendar', t: 'Schedule call', s: 'Put it on the calendar' },
        { id: 'client', icon: 'users', t: 'Add client', s: 'Onboard a signed account' }
      ];

      /* Funnel widths are relative to the top of the funnel; the data
         guarantees a monotonic descent so a later bar is never wider. */
      var top = d.funnel[0].count;
      var funnel = d.funnel.map(function (f, i) {
        var next = d.funnel[i + 1];
        var conv = next ? Math.round(next.count / f.count * 100) : null;
        return '<div class="bx-fun__row">' +
          '<div class="bx-fun__k bx-mono">' + H.esc(f.stage) + '</div>' +
          '<div class="bx-fun__track"><div class="bx-fun__bar" style="width:' +
            Math.round(f.count / top * 100) + '%"></div>' +
            '<span class="bx-fun__n bx-mono">' + f.count + '</span></div>' +
          '<div class="bx-fun__c bx-mono">' + (conv == null ? '—' : conv + '%') + '</div>' +
        '</div>';
      }).join('');

      var today = d.meetings.filter(function (m) { return m.on === d.today; });
      var owing = d.invoices.filter(function (i) {
        return i.status === 'Outstanding' || i.status === 'Overdue';
      }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 4);
      var lowest = d.clients.slice().sort(function (a, b) { return a.health - b.health; }).slice(0, 3);

      return '' +
      '<div class="bx-greet"><h2>Good morning, ' + H.esc(d.agency.founder.split(' ')[0]) + '</h2>' +
        '<span class="bx-mono">' + H.date(d.today, 'long') + '</span></div>' +

      '<div class="bx-stats bx-stats--5">' + stats + '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h"><h3>Quick actions</h3></div>' +
        '<div class="bx-qas" style="' + H.autoCols(acts.length, 4) + '">' + acts.map(function (a) {
          /* Label and sub-line share one wrapper: .bx-qa is a flex row and
             `> span:last-child` is what gets flex:1, so loose siblings would
             lay out beside each other instead of stacking. */
          return '<button class="bx-qa" data-act="' + a.id + '" type="button">' +
            '<span class="bx-qa__chip">' + I(a.icon) + '</span>' +
            '<span><span class="bx-qa__t">' + H.esc(a.t) + '</span>' +
            '<span class="bx-qa__s">' + H.esc(a.s) + '</span></span></button>';
        }).join('') + '</div></div>' +

      '<div class="bx-split">' +
        '<div class="bx-stack">' +
          '<section class="bx-card">' +
            '<div class="bx-card__head"><h3>Funnel — last 30 days</h3>' +
              '<span class="bx-card__head-r bx-mono">' + Math.round(d.funnel[4].count / d.funnel[0].count * 100) + '% end to end</span></div>' +
            '<div class="bx-card__body"><div class="bx-fun">' +
              '<div class="bx-fun__hd bx-mono"><span>Stage</span><span>Count</span><span>To next</span></div>' +
              funnel + '</div>' +
              '<p class="bx-sr">Of ' + d.funnel[0].count + ' leads captured, ' + d.funnel[4].count + ' closed won.</p>' +
            '</div>' + H.more('leads', 'Open pipeline') +
          '</section>' +

          '<section class="bx-card">' +
            '<div class="bx-card__head"><h3>Recent activity</h3></div>' +
            '<div class="bx-card__body"><ul class="bx-feed">' + d.activity.slice(0, 7).map(function (a) {
              /* a.what carries an intentional <b> around the entity name — the
                 only raw HTML in the app. Everything around it is escaped. */
              return '<li><div class="bx-feed__t"><b>' + H.esc(a.who) + '</b> ' + a.what + '</div>' +
                '<div class="bx-feed__w">' + H.ago(a.at) + '</div></li>';
            }).join('') + '</ul></div>' +
          '</section>' +
        '</div>' +

        '<div class="bx-stack">' +
          '<section class="bx-card">' +
            '<div class="bx-card__head"><h3>Today</h3>' +
              '<span class="bx-card__head-r bx-mono">' + today.length + ' booked</span></div>' +
            '<div class="bx-card__body">' + (today.length ? today.map(function (m) {
              return '<div class="bx-slot"><span class="bx-slot__t bx-mono">' + H.esc(m.at) + '</span>' +
                '<span class="bx-slot__b"><span class="bx-slot__n">' + H.esc(m.title) + '</span>' +
                '<span class="bx-slot__w">' + H.esc(m.who) + '</span></span>' +
                '<span class="bx-pill bx-pill--' + typeTone(m.type) + '">' + H.esc(m.type) + '</span></div>';
            }).join('') : H.empty('calendar', 'Nothing booked today', 'A clear day. Use it.')) +
            '</div>' + H.more('calendar', 'Open calendar') +
          '</section>' +

          '<section class="bx-card">' +
            '<div class="bx-card__head"><h3>Outstanding</h3>' +
              '<span class="bx-card__head-r bx-mono">' + BIX.money0(t.outstanding) + '</span></div>' +
            '<div class="bx-card__body">' + (owing.length ? owing.map(function (i) {
              return '<div class="bx-owe' + (i.status === 'Overdue' ? ' is-late' : '') + '">' +
                '<span class="bx-owe__c">' + H.esc(i.client) + '<span class="bx-mono">' + H.esc(i.id) + ' · due ' + H.date(i.due, 'short') + '</span></span>' +
                '<span class="bx-owe__a bx-mono">' + BIX.money0(i.amount) + '</span></div>';
            }).join('') : H.empty('check', 'All settled', 'No outstanding invoices.')) +
            '</div>' + H.more('revenue', 'Open revenue') +
          '</section>' +

          '<section class="bx-card">' +
            '<div class="bx-card__head"><h3>Client health</h3>' +
              '<span class="bx-card__head-r bx-mono">avg ' + t.avgHealth + '</span></div>' +
            '<div class="bx-card__body"><div class="bx-healths">' + lowest.map(function (c) {
              return '<div class="bx-health">' + ring(c.health, '', true) +
                '<div class="bx-health__t"><div class="bx-health__n">' + H.esc(c.business) + '</div>' +
                '<div class="bx-health__s bx-mono">' + H.esc(c.plan) + ' · ' + BIX.money0(c.mrr) + '/mo</div></div></div>';
            }).join('') + '</div></div>' + H.more('clients', 'Open clients') +
          '</section>' +
        '</div>' +
      '</div>';
    },
    mount: function (el) {
      animateRings(el);
      el.querySelectorAll('[data-act]').forEach(function (b) {
        b.addEventListener('click', function () {
          var fn = BIX.actions[b.getAttribute('data-act')];
          if (fn) fn();
        });
      });
    }
  };

  function typeTone(t) {
    return t === 'Sales' ? 'blue' : t === 'Discovery' ? 'purple' : t === 'Internal' ? 'neutral' : 'green';
  }
  BIX.typeTone = typeTone;

  /* =============================== CLIENTS ================================ */
  var clientFilter = { plan: 'All', status: 'All' };

  BIX.views.clients = {
    wide: true,
    render: function () {
      var d = BIX.data, t = d.totals;
      var plans = ['All'].concat(d.clients.map(function (c) { return c.plan; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      var statuses = ['All'].concat(d.clients.map(function (c) { return c.status; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));

      var rows = d.clients.filter(function (c) {
        return (clientFilter.plan === 'All' || c.plan === clientFilter.plan) &&
               (clientFilter.status === 'All' || c.status === clientFilter.status);
      });

      return '' +
      '<div class="bx-stats">' +
        H.stat({ k: 'Active clients', v: t.activeClients, icon: 'users', tone: 'purple' }) +
        H.stat({ k: 'Total MRR', v: BIX.money0(t.mrr), icon: 'money', tone: 'green' }) +
        H.stat({ k: 'Avg health', v: t.avgHealth, icon: 'zap', tone: 'blue' }) +
        H.stat({ k: 'Churn risk', v: t.churnRisk, icon: 'warn', tone: t.churnRisk ? 'red' : 'green' }) +
      '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h">' +
        '<div class="bx-chips">' +
          plans.map(function (p) {
            return '<button class="bx-chip' + (p === clientFilter.plan ? ' is-on' : '') + '" data-plan="' + H.esc(p) + '">' + H.esc(p) + '</button>';
          }).join('') +
          '<span class="bx-chips__sep"></span>' +
          statuses.map(function (s) {
            return '<button class="bx-chip' + (s === clientFilter.status ? ' is-on' : '') + '" data-status="' + H.esc(s) + '">' + H.esc(s) + '</button>';
          }).join('') +
        '</div>' +
        '<span class="bx-mono bx-faint">' + rows.length + ' of ' + d.clients.length + '</span>' +
      '</div>' +

      (rows.length ? '<div class="bx-table__wrap"><table class="bx-table">' +
        '<thead><tr>' +
          '<th scope="col">Business</th><th scope="col" class="c-ind">Industry</th>' +
          '<th scope="col" class="c-con">Contact</th><th scope="col">Plan</th>' +
          '<th scope="col" class="num">MRR</th><th scope="col" class="c-st">Status</th>' +
          '<th scope="col" class="c-he">Health</th><th scope="col" class="c-pr">Project</th>' +
        '</tr></thead><tbody>' +
        rows.map(function (c) {
          return '<tr data-client="' + H.esc(c.id) + '" tabindex="0">' +
            '<td><span class="bx-table__name">' + H.esc(c.business) + '</span>' +
              '<span class="bx-table__sub bx-mono">' + H.esc(c.location) + '</span></td>' +
            '<td class="c-ind">' + H.esc(c.industry) + '</td>' +
            '<td class="c-con">' + H.esc(c.contact) + '</td>' +
            '<td><span class="bx-pill bx-pill--purple">' + H.esc(c.plan) + '</span></td>' +
            '<td class="num bx-mono">' + BIX.money0(c.mrr) + '</td>' +
            '<td class="c-st">' + H.pill(c.status) + '</td>' +
            '<td class="c-he">' + meter(c.health, healthTone(c.health)) + '</td>' +
            '<td class="c-pr"><span class="bx-table__name">' + H.esc(c.project) + '</span>' +
              '<span class="bx-table__sub bx-mono">' + c.percent + '% complete</span></td>' +
          '</tr>';
        }).join('') + '</tbody></table></div>'
        : H.empty('users', 'No clients match', 'Try a different plan or status filter.')) +
      '</div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-plan]').forEach(function (b) {
        b.addEventListener('click', function () { clientFilter.plan = b.getAttribute('data-plan'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-status]').forEach(function (b) {
        b.addEventListener('click', function () { clientFilter.status = b.getAttribute('data-status'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-client]').forEach(function (tr) {
        function open() { clientDrawer(tr.getAttribute('data-client')); }
        tr.addEventListener('click', open);
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      });
    }
  };

  function clientDrawer(id) {
    var c = BIX.data.clients.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var proj = BIX.data.projects.filter(function (p) { return p.client === c.business; })[0];
    var bills = BIX.data.invoices.filter(function (i) { return i.client === c.business; }).slice(0, 4);

    BIX.drawer({
      eyebrow: c.industry + ' · ' + c.location,
      title: c.business,
      body:
        '<div class="bx-dhero">' +
          '<div><div class="bx-dhero__k bx-mono">MRR</div><div class="bx-dhero__v">' + BIX.money0(c.mrr) + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Health</div><div class="bx-dhero__v is-' + healthTone(c.health) + '">' + c.health + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Plan</div><div class="bx-dhero__v is-plan">' + H.esc(c.plan) + '</div></div>' +
        '</div>' +

        (proj ? '<section class="bx-dsec"><h4>Current project</h4>' +
          '<div class="bx-dproj">' + ring(proj.percent, 'done') +
            '<div><div class="bx-dproj__n">' + H.esc(proj.title) + '</div>' +
              '<div class="bx-dproj__m bx-mono">' + H.esc(proj.phase) + ' · due ' + H.date(proj.due, 'short') + '</div>' +
              '<p class="bx-dproj__s">' + H.esc(proj.notes) + '</p></div></div></section>' : '') +

        '<section class="bx-dsec"><h4>Contact</h4>' +
          contactRow('mail', 'Email', c.email) + contactRow('phone', 'Phone', c.phone) +
          '<div class="bx-drow"><span class="bx-drow__k bx-mono">Client since</span>' +
            '<span class="bx-drow__v">' + H.date(c.since) + '</span></div>' +
        '</section>' +

        '<section class="bx-dsec"><h4>Recent invoices</h4>' +
          (bills.length ? bills.map(function (i) {
            return '<div class="bx-drow"><span class="bx-drow__k bx-mono">' + H.esc(i.id) + '</span>' +
              '<span class="bx-drow__v">' + BIX.money0(i.amount) + ' ' + H.pill(i.status) + '</span></div>';
          }).join('') : '<p class="bx-faint">No invoices yet.</p>') +
        '</section>',
      foot:
        '<button class="bx-btn bx-btn--ghost" data-go="projects">Open project</button>' +
        '<a class="bx-btn bx-btn--primary" href="../portal/" data-go-skip>View as client</a>',
      mount: function (w) {
        animateRings(w);
        wireCopy(w);
      }
    });
  }

  function contactRow(icon, label, value) {
    return '<div class="bx-drow"><span class="bx-drow__k bx-mono">' + I(icon) + ' ' + H.esc(label) + '</span>' +
      '<span class="bx-drow__v">' + H.esc(value) +
      '<button class="bx-iconbtn bx-iconbtn--xs" data-copy="' + H.esc(value) + '" data-copy-label="' + H.esc(label) + '" aria-label="Copy ' + H.esc(label) + '">' +
      I('copy') + '</button></span></div>';
  }
  BIX.contactRow = contactRow;

  function wireCopy(w) {
    w.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        BIX.copy(b.getAttribute('data-copy'), b.getAttribute('data-copy-label'));
      });
    });
  }
  BIX.wireCopy = wireCopy;

  BIX.actions.client = function () {
    BIX.modal({
      title: 'Add client',
      body:
        '<div class="bx-field"><label for="ncB">Business</label><input id="ncB" placeholder="Business name" /></div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="ncC">Contact</label><input id="ncC" placeholder="Full name" /></div>' +
          '<div class="bx-field"><label for="ncE">Email</label><input id="ncE" type="email" placeholder="name@business.com" /></div>' +
        '</div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="ncI">Industry</label><input id="ncI" placeholder="e.g. Med spa" /></div>' +
          '<div class="bx-field"><label for="ncP">Plan</label><select id="ncP">' +
            '<option>Essential</option><option selected>Growth Care</option><option>Scale</option></select></div>' +
        '</div>' +
        '<div class="bx-field"><label for="ncM">Monthly retainer (USD)</label><input id="ncM" type="number" value="340" /></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="ncSave">Add client</button>',
      mount: function (w) {
        w.querySelector('#ncSave').addEventListener('click', function () {
          var biz = w.querySelector('#ncB').value.trim();
          if (!biz) { BIX.toast('Give the client a business name'); return; }
          BIX.data.clients.unshift({
            id: 'c-' + Date.now(), business: biz,
            industry: w.querySelector('#ncI').value.trim() || 'General',
            contact: w.querySelector('#ncC').value.trim() || '—',
            email: w.querySelector('#ncE').value.trim() || '—', phone: '—', location: '—',
            plan: w.querySelector('#ncP').value, mrr: Number(w.querySelector('#ncM').value) || 0,
            status: 'Active', health: 100, since: BIX.data.today,
            project: 'Onboarding', percent: 0
          });
          BIX.data.activity.unshift({ at: BIX.data.today + 'T09:00:00', who: BIX.data.agency.founder, what: 'added client <b>' + H.esc(biz) + '</b>' });
          BIX.recompute();
          BIX.closeModal();
          BIX.app.go('clients');
          BIX.app.refreshChrome();
          BIX.toast(biz + ' added');
        });
      }
    });
  };

  /* =============================== PROJECTS =============================== */
  var projMode = 'board';
  /* Same rule as the leads board: below 560 the table is the only readable
     shape, so force it in JS instead of hiding the board in CSS. */
  function projNarrow() { return window.innerWidth <= 560; }

  BIX.views.projects = {
    wide: true,
    render: function () {
      var d = BIX.data, t = d.totals;
      var head =
        '<div class="bx-stats bx-stats--3">' +
          H.stat({ k: 'Active builds', v: t.activeBuilds, icon: 'layers', tone: 'purple' }) +
          H.stat({ k: 'Launching this month', v: t.launchingThisMonth, icon: 'zap', tone: 'blue' }) +
          H.stat({ k: 'Overdue', v: t.overdueBuilds, icon: 'warn', tone: t.overdueBuilds ? 'red' : 'green' }) +
        '</div>' +
        '<div class="bx-sec"><div class="bx-sec__h">' +
          (projNarrow() ? '<span></span>' :
          '<div class="bx-seg" role="tablist" aria-label="Project layout">' +
            '<button class="bx-seg__b' + (projMode === 'board' ? ' is-on' : '') + '" data-pm="board" role="tab" aria-selected="' + (projMode === 'board') + '">' + I('grid') + ' Board</button>' +
            '<button class="bx-seg__b' + (projMode === 'table' ? ' is-on' : '') + '" data-pm="table" role="tab" aria-selected="' + (projMode === 'table') + '">' + I('list') + ' Table</button>' +
          '</div>') +
          '<span class="bx-mono bx-faint">' + d.projects.length + ' projects</span>' +
        '</div>';

      if (projNarrow() || projMode === 'table') {
        return head + '<div class="bx-table__wrap"><table class="bx-table">' +
          '<thead><tr><th scope="col">Project</th><th scope="col" class="c-con">Client</th>' +
          '<th scope="col">Phase</th><th scope="col" class="c-he">Progress</th>' +
          '<th scope="col" class="c-ind">Team</th><th scope="col">Due</th></tr></thead><tbody>' +
          d.projects.map(function (p) { return projRow(p); }).join('') +
          '</tbody></table></div></div>';
      }

      return head + '<div class="bx-board">' + d.phases.map(function (ph) {
        var items = d.projects.filter(function (p) { return p.phase === ph; });
        return '<div class="bx-col">' +
          '<div class="bx-col__h bx-mono"><span>' + H.esc(ph) + '</span><span>' + items.length + '</span></div>' +
          '<div class="bx-col__b">' + (items.length ? items.map(projCard).join('')
            : '<div class="bx-col__none bx-mono">Empty</div>') + '</div></div>';
      }).join('') + '</div></div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-pm]').forEach(function (b) {
        b.addEventListener('click', function () { projMode = b.getAttribute('data-pm'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-proj]').forEach(function (n) {
        function open() { projDrawer(n.getAttribute('data-proj')); }
        n.addEventListener('click', open);
        n.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      });
    }
  };

  function late(p) { return p.phase !== 'Launched' && p.due < BIX.data.today; }

  function projCard(p) {
    return '<article class="bx-pcard" data-proj="' + H.esc(p.id) + '" tabindex="0">' +
      '<div class="bx-pcard__c bx-mono">' + H.esc(p.client) + '</div>' +
      '<div class="bx-pcard__t">' + H.esc(p.title) + '</div>' +
      meter(p.percent) +
      '<div class="bx-pcard__f">' +
        '<span class="bx-avatars">' + p.team.map(function (m) {
          return '<span class="bx-avatar bx-avatar--sm" title="' + H.esc(H.member(m).name) + '">' + H.esc(H.member(m).initials) + '</span>';
        }).join('') + '</span>' +
        '<span class="bx-mono bx-pcard__d' + (late(p) ? ' is-late' : '') + '">' +
          (late(p) ? I('warn') : '') + H.date(p.due, 'short') + '</span>' +
      '</div></article>';
  }

  function projRow(p) {
    return '<tr data-proj="' + H.esc(p.id) + '" tabindex="0">' +
      '<td><span class="bx-table__name">' + H.esc(p.title) + '</span></td>' +
      '<td class="c-con">' + H.esc(p.client) + '</td>' +
      '<td>' + H.pill(p.phase) + '</td>' +
      '<td class="c-he">' + meter(p.percent) + '</td>' +
      '<td class="c-ind"><span class="bx-avatars">' + p.team.map(function (m) {
        return '<span class="bx-avatar bx-avatar--sm">' + H.esc(H.member(m).initials) + '</span>';
      }).join('') + '</span></td>' +
      '<td class="bx-mono' + (late(p) ? ' is-late' : '') + '">' + H.date(p.due, 'short') + '</td></tr>';
  }

  function projDrawer(id) {
    var p = BIX.data.projects.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    BIX.drawer({
      eyebrow: p.client,
      title: p.title,
      body:
        '<div class="bx-dhero">' +
          '<div><div class="bx-dhero__k bx-mono">Phase</div><div class="bx-dhero__v is-plan">' + H.esc(p.phase) + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Progress</div><div class="bx-dhero__v">' + p.percent + '%</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Due</div><div class="bx-dhero__v' + (late(p) ? ' is-red' : '') + '">' + H.date(p.due, 'short') + '</div></div>' +
        '</div>' +
        '<section class="bx-dsec"><h4>Deliverables</h4>' +
          p.checklist.map(function (c, i) {
            return '<label class="bx-tick"><input type="checkbox" data-tick="' + i + '"' + (c[1] ? ' checked' : '') + ' />' +
              '<span class="bx-tick__box">' + I('check') + '</span><span>' + H.esc(c[0]) + '</span></label>';
          }).join('') +
        '</section>' +
        '<section class="bx-dsec"><h4>Team</h4><div class="bx-team">' + p.team.map(function (m) {
          var t = H.member(m);
          return '<div class="bx-person">' + H.avatar(t.name) +
            '<div><div class="bx-person__n">' + H.esc(t.name) + '</div>' +
            '<div class="bx-person__r bx-mono">' + H.esc(t.role) + '</div></div></div>';
        }).join('') + '</div></section>' +
        '<section class="bx-dsec"><h4>Notes</h4><p class="bx-dnote">' + H.esc(p.notes) + '</p></section>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>' +
            '<button class="bx-btn bx-btn--primary" data-go="clients">Open client</button>',
      mount: function (w) {
        w.querySelectorAll('[data-tick]').forEach(function (box) {
          box.addEventListener('change', function () {
            var i = Number(box.getAttribute('data-tick'));
            p.checklist[i][1] = box.checked;
            var done = p.checklist.filter(function (c) { return c[1]; }).length;
            p.percent = Math.round(done / p.checklist.length * 100);
            BIX.toast(p.checklist[i][0] + (box.checked ? ' marked done' : ' reopened'));
          });
        });
      }
    });
  }
})();
