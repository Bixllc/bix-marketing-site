/* ==========================================================================
   views-business.js — revenue, calendar, settings
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;
  BIX.actions = BIX.actions || {};

  /* ================================ REVENUE =============================== */
  var invFilter = 'All';

  /* Hand-rolled SVG. A fixed viewBox with preserveAspectRatio="none" would
     skew the stroke, so the chart keeps its ratio and scales as a unit. */
  function chart(series) {
    var W = 640, Ht = 190, padL = 46, padR = 12, padT = 14, padB = 26;
    var max = Math.max.apply(null, series.map(function (p) { return p.total; })) * 1.12;
    var iw = W - padL - padR, ih = Ht - padT - padB;
    var step = iw / (series.length - 1);
    var pts = series.map(function (p, i) {
      return { x: padL + i * step, y: padT + ih - (p.total / max) * ih, p: p };
    });
    var line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1].x.toFixed(1) + ' ' + (padT + ih) + ' L' + padL + ' ' + (padT + ih) + ' Z';

    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
      var y = padT + ih * f;
      return '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '" stroke="rgba(20,16,31,.05)"/>' +
        '<text x="' + (padL - 8) + '" y="' + (y + 3.5).toFixed(1) + '" class="bx-cx" text-anchor="end">' +
          BIX.money0(Math.round(max * (1 - f) / 100) * 100) + '</text>';
    }).join('');

    var labels = pts.map(function (q, i) {
      if (i % 2) return '';
      return '<text x="' + q.x.toFixed(1) + '" y="' + (Ht - 8) + '" class="bx-cx" text-anchor="middle">' + q.p.m + '</text>';
    }).join('');

    var hits = pts.map(function (q, i) {
      return '<rect class="bx-chart__hit" x="' + (q.x - step / 2).toFixed(1) + '" y="' + padT + '" width="' + step.toFixed(1) +
        '" height="' + ih + '" fill="transparent" data-i="' + i + '" data-x="' + q.x.toFixed(1) +
        '" data-y="' + q.y.toFixed(1) + '" data-l="' + H.esc(q.p.m + ' ' + q.p.y + ' · ' + BIX.money0(q.p.total)) + '"/>';
    }).join('');

    return '<div class="bx-chart2" id="rvChart">' +
      '<svg viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Monthly revenue, last 12 months">' +
        '<defs><linearGradient id="bxAreaG" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#442061" stop-opacity=".22"/>' +
          '<stop offset="100%" stop-color="#442061" stop-opacity="0"/></linearGradient></defs>' +
        grid +
        '<path d="' + area + '" fill="url(#bxAreaG)"/>' +
        '<path d="' + line + '" fill="none" stroke="#442061" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<line id="rvCross" class="bx-cross2" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + ih) + '"/>' +
        '<circle id="rvDot" class="bx-cdot" r="4" cx="-99" cy="-99"/>' +
        labels + hits +
      '</svg>' +
      '<div class="bx-ctip bx-mono" id="rvTip"></div>' +
      '<p class="bx-sr">Revenue rose from ' + BIX.money0(series[0].total) + ' in ' + series[0].m + ' ' + series[0].y +
        ' to ' + BIX.money0(series[series.length - 1].total) + ' in ' + series[series.length - 1].m + ' ' + series[series.length - 1].y + '.</p>' +
    '</div>';
  }

  function byPlan() {
    var map = {};
    BIX.data.clients.forEach(function (c) {
      if (c.status === 'Paused') return;
      map[c.plan] = (map[c.plan] || 0) + c.mrr;
    });
    return Object.keys(map).map(function (k) { return { plan: k, mrr: map[k] }; })
      .sort(function (a, b) { return b.mrr - a.mrr; });
  }

  BIX.views.revenue = {
    wide: true,
    render: function () {
      var d = BIX.data, t = d.totals;
      var plans = byPlan(), planTotal = plans.reduce(function (a, p) { return a + p.mrr; }, 0);
      var tones = ['purple', 'blue', 'green', 'amber'];

      var rows = d.invoices.filter(function (i) { return invFilter === 'All' || i.status === invFilter; });

      return '' +
      '<div class="bx-rhero">' +
        '<div class="bx-rhero__m">' +
          '<div class="bx-rhero__k bx-mono">Monthly recurring</div>' +
          '<div class="bx-rhero__v">' + BIX.money0(t.mrr) + '</div>' +
          H.delta(d.deltas.mrr) +
        '</div>' +
        '<div class="bx-rhero__s">' +
          '<div class="bx-rhero__k bx-mono">Outstanding</div>' +
          '<div class="bx-rhero__n">' + BIX.money0(t.outstanding) + '</div>' +
          '<div class="bx-mono bx-faint">' + t.overdueCount + ' overdue</div>' +
          (t.overdueCount ? '<button class="bx-btn bx-btn--ghost bx-btn--sm" id="rvChase">Chase overdue</button>' : '') +
        '</div>' +
        '<div class="bx-rhero__s">' +
          '<div class="bx-rhero__k bx-mono">Collected this month</div>' +
          '<div class="bx-rhero__n">' + BIX.money0(t.collected) + '</div>' +
          '<div class="bx-mono bx-faint">' + H.date(d.today, 'mon') + ' to date</div>' +
        '</div>' +
      '</div>' +

      '<div class="bx-split bx-split--chart">' +
        '<section class="bx-card">' +
          '<div class="bx-card__head"><h3>Revenue — 12 months</h3></div>' +
          '<div class="bx-card__body">' + chart(d.revenue) + '</div>' +
        '</section>' +
        '<section class="bx-card">' +
          '<div class="bx-card__head"><h3>By plan</h3>' +
            '<span class="bx-card__head-r bx-mono">' + BIX.money0(planTotal) + '</span></div>' +
          '<div class="bx-card__body">' +
            '<div class="bx-stack2">' + plans.map(function (p, i) {
              return '<span class="bx-stack2__s is-' + tones[i % 4] + '" style="width:' +
                (p.mrr / planTotal * 100).toFixed(1) + '%" title="' + H.esc(p.plan) + '"></span>';
            }).join('') + '</div>' +
            '<div class="bx-legend">' + plans.map(function (p, i) {
              return '<div class="bx-legend__r"><span class="bx-legend__d is-' + tones[i % 4] + '"></span>' +
                '<span class="bx-legend__n">' + H.esc(p.plan) + '</span>' +
                '<span class="bx-legend__v bx-mono">' + BIX.money0(p.mrr) + '</span></div>';
            }).join('') + '</div>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h">' +
        '<div class="bx-chips">' + ['All', 'Outstanding', 'Overdue', 'Paid'].map(function (s) {
          return '<button class="bx-chip' + (s === invFilter ? ' is-on' : '') + '" data-inv="' + H.esc(s) + '">' + H.esc(s) + '</button>';
        }).join('') + '</div>' +
        '<button class="bx-btn bx-btn--primary bx-btn--sm" data-act="invoice">' + I('plus') + ' New invoice</button>' +
      '</div>' +
      (rows.length ? '<div class="bx-table__wrap"><table class="bx-table">' +
        '<thead><tr><th scope="col">Invoice</th><th scope="col">Client</th>' +
        '<th scope="col" class="c-ind">Description</th><th scope="col" class="num">Amount</th>' +
        '<th scope="col" class="c-tou">Due</th><th scope="col">Status</th>' +
        '<th scope="col" class="c-act"><span class="bx-sr">Actions</span></th></tr></thead><tbody>' +
        rows.map(function (i) {
          return '<tr class="' + (i.status === 'Overdue' ? 'is-late' : '') + '">' +
            '<td class="bx-mono">' + H.esc(i.id) + '</td>' +
            '<td><span class="bx-table__name">' + H.esc(i.client) + '</span></td>' +
            '<td class="c-ind">' + H.esc(i.descr) + '</td>' +
            '<td class="num bx-mono">' + BIX.money(i.amount) + '</td>' +
            '<td class="c-tou bx-mono">' + H.date(i.due, 'short') + '</td>' +
            '<td>' + H.pill(i.status) + '</td>' +
            '<td class="c-act"><span class="bx-acts">' +
              '<button class="bx-iconbtn bx-iconbtn--xs" data-view="' + H.esc(i.id) + '" aria-label="View ' + H.esc(i.id) + '">' + I('doc') + '</button>' +
              (i.status === 'Paid' ? '' :
                '<button class="bx-iconbtn bx-iconbtn--xs" data-paid="' + H.esc(i.id) + '" aria-label="Mark ' + H.esc(i.id) + ' paid">' + I('check') + '</button>' +
                '<button class="bx-iconbtn bx-iconbtn--xs" data-resend="' + H.esc(i.id) + '" aria-label="Resend ' + H.esc(i.id) + '">' + I('send') + '</button>') +
            '</span></td></tr>';
        }).join('') + '</tbody></table></div>'
        : H.empty('money', 'No invoices match', 'Try another status filter.')) +
      '</div>';
    },

    mount: function (el) {
      wireChart(el);
      el.querySelectorAll('[data-inv]').forEach(function (b) {
        b.addEventListener('click', function () { invFilter = b.getAttribute('data-inv'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-act="invoice"]').forEach(function (b) {
        b.addEventListener('click', function () { BIX.actions.invoice(); });
      });
      el.querySelectorAll('[data-view]').forEach(function (b) {
        b.addEventListener('click', function () { invoiceModal(b.getAttribute('data-view')); });
      });
      el.querySelectorAll('[data-paid]').forEach(function (b) {
        b.addEventListener('click', function () { markPaid(b.getAttribute('data-paid')); });
      });
      el.querySelectorAll('[data-resend]').forEach(function (b) {
        b.addEventListener('click', function () {
          BIX.toast(b.getAttribute('data-resend') + ' resent');
        });
      });
      var chase = el.querySelector('#rvChase');
      if (chase) chase.addEventListener('click', function () {
        var od = BIX.data.invoices.filter(function (i) { return i.status === 'Overdue'; });
        BIX.toast('Reminder queued for ' + od.length + ' overdue account' + (od.length === 1 ? '' : 's'));
        BIX.data.activity.unshift({
          at: BIX.data.today + 'T09:00:00', who: BIX.data.agency.founder,
          what: 'chased <b>' + od.length + ' overdue invoice' + (od.length === 1 ? '' : 's') + '</b>'
        });
      });
    }
  };

  function wireChart(el) {
    var host = el.querySelector('#rvChart');
    if (!host) return;
    var cross = host.querySelector('#rvCross');
    var dot = host.querySelector('#rvDot');
    var tip = host.querySelector('#rvTip');
    host.querySelectorAll('.bx-chart__hit').forEach(function (r) {
      r.addEventListener('mouseenter', function () {
        var x = r.getAttribute('data-x'), y = r.getAttribute('data-y');
        cross.setAttribute('x1', x); cross.setAttribute('x2', x);
        cross.classList.add('is-on');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        tip.textContent = r.getAttribute('data-l');
        tip.style.left = (Number(x) / 640 * 100) + '%';
        tip.classList.add('is-on');
      });
    });
    host.addEventListener('mouseleave', function () {
      cross.classList.remove('is-on');
      dot.setAttribute('cx', -99);
      tip.classList.remove('is-on');
    });
  }

  function markPaid(id) {
    var i = BIX.data.invoices.filter(function (x) { return x.id === id; })[0];
    if (!i) return;
    i.status = 'Paid';
    i.paid = BIX.data.today;
    BIX.data.activity.unshift({
      at: BIX.data.today + 'T09:00:00', who: 'System',
      what: 'payment received for <b>' + H.esc(i.id) + '</b>'
    });
    BIX.recompute();
    BIX.app.rerender();
    BIX.app.refreshChrome();
    BIX.toast(i.id + ' marked paid');
  }

  function invoiceModal(id) {
    var i = BIX.data.invoices.filter(function (x) { return x.id === id; })[0];
    if (!i) return;
    BIX.modal({
      title: 'Invoice ' + i.id,
      body:
        '<div class="bx-invhd">' +
          '<div><div class="bx-dhero__k bx-mono">Billed to</div>' +
            '<div class="bx-invhd__c">' + H.esc(i.client) + '</div></div>' +
          '<div class="bx-invhd__r">' + H.pill(i.status) +
            '<div class="bx-invhd__a">' + BIX.money(i.amount) + '</div></div>' +
        '</div>' +
        '<div class="bx-drow"><span class="bx-drow__k bx-mono">Description</span><span class="bx-drow__v">' + H.esc(i.descr) + '</span></div>' +
        '<div class="bx-drow"><span class="bx-drow__k bx-mono">Due</span><span class="bx-drow__v">' + H.date(i.due, 'long') + '</span></div>' +
        (i.paid ? '<div class="bx-drow"><span class="bx-drow__k bx-mono">Paid</span><span class="bx-drow__v">' + H.date(i.paid, 'long') + '</span></div>' : '') +
        '<p class="bx-mono bx-faint" style="margin-top:14px">Bix LLC · admin@bixllc.net</p>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>' +
        (i.status === 'Paid' ? '' : '<button class="bx-btn bx-btn--primary" id="ivPaid">Mark paid</button>'),
      mount: function (w) {
        var b = w.querySelector('#ivPaid');
        if (b) b.addEventListener('click', function () { BIX.closeModal(); markPaid(i.id); });
      }
    });
  }

  BIX.actions.invoice = function () {
    var d = BIX.data;
    var lines = [{ what: '', amt: 0 }];

    function linesHtml() {
      return lines.map(function (l, i) {
        return '<div class="bx-line" data-line="' + i + '">' +
          '<input class="bx-line__w" value="' + H.esc(l.what) + '" placeholder="Line item" aria-label="Line item ' + (i + 1) + '" />' +
          '<input class="bx-line__a" type="number" value="' + l.amt + '" aria-label="Amount ' + (i + 1) + '" />' +
          '<button class="bx-iconbtn bx-iconbtn--xs" data-drop="' + i + '" aria-label="Remove line ' + (i + 1) + '"' +
            (lines.length === 1 ? ' disabled' : '') + '>' + I('trash') + '</button></div>';
      }).join('');
    }

    BIX.modal({
      title: 'New invoice',
      body:
        '<div class="bx-field"><label for="niC">Client</label><select id="niC">' +
          d.clients.map(function (c) { return '<option>' + H.esc(c.business) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="bx-field"><label>Line items</label><div id="niLines">' + linesHtml() + '</div>' +
          '<button class="bx-btn bx-btn--ghost bx-btn--sm" id="niAdd" type="button">' + I('plus') + ' Add line</button></div>' +
        '<div class="bx-total"><span class="bx-mono">Total</span><span class="bx-total__v" id="niTotal">$0.00</span></div>' +
        '<div class="bx-field"><label for="niD">Due date</label><input id="niD" type="date" value="' + nextWeek() + '" /></div>' +
        '<div class="bx-field"><label for="niN">Notes</label><textarea id="niN" rows="2" placeholder="Optional"></textarea></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="niSave">Create invoice</button>',
      mount: function (w) {
        var host = w.querySelector('#niLines');

        function total() {
          return lines.reduce(function (a, l) { return a + (Number(l.amt) || 0); }, 0);
        }
        function repaint() {
          host.innerHTML = linesHtml();
          wire();
          w.querySelector('#niTotal').textContent = BIX.money(total());
        }
        function wire() {
          host.querySelectorAll('.bx-line').forEach(function (row) {
            var i = Number(row.getAttribute('data-line'));
            row.querySelector('.bx-line__w').addEventListener('input', function (e) { lines[i].what = e.target.value; });
            row.querySelector('.bx-line__a').addEventListener('input', function (e) {
              lines[i].amt = Number(e.target.value) || 0;
              w.querySelector('#niTotal').textContent = BIX.money(total());
            });
            var drop = row.querySelector('[data-drop]');
            drop.addEventListener('click', function () {
              if (lines.length === 1) return;
              lines.splice(i, 1); repaint();
            });
          });
        }
        wire();

        w.querySelector('#niAdd').addEventListener('click', function () {
          lines.push({ what: '', amt: 0 }); repaint();
        });

        w.querySelector('#niSave').addEventListener('click', function () {
          var amt = total();
          if (!amt) { BIX.toast('Add at least one line with an amount'); return; }
          var num = 'INV-' + (2044 + d.invoices.length - 18);
          d.invoices.unshift({
            id: num, client: w.querySelector('#niC').value,
            descr: lines.map(function (l) { return l.what; }).filter(Boolean).join(', ') || 'Services',
            amount: amt, due: w.querySelector('#niD').value || nextWeek(),
            status: 'Outstanding', paid: null
          });
          d.activity.unshift({
            at: d.today + 'T09:00:00', who: d.agency.founder,
            what: 'issued invoice <b>' + H.esc(num) + '</b>'
          });
          BIX.recompute();
          BIX.closeModal();
          BIX.app.go('revenue');
          BIX.app.refreshChrome();
          BIX.toast(num + ' created');
        });
      }
    });
  };

  function nextWeek() {
    var d = new Date(BIX.data.today + 'T12:00:00');
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  }

  /* =============================== CALENDAR =============================== */
  var cal = { ym: BIX.data.today.slice(0, 7), pick: BIX.data.today };

  function ymShift(ym, n) {
    var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + n;
    var d = new Date(y, m, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  BIX.views.calendar = {
    wide: true,
    render: function () {
      var d = BIX.data;
      var y = Number(cal.ym.slice(0, 4)), m = Number(cal.ym.slice(5, 7)) - 1;
      var first = new Date(y, m, 1), lead = first.getDay();
      var days = new Date(y, m + 1, 0).getDate();
      var label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      var cells = '';
      for (var i = 0; i < lead; i++) cells += '<div class="bx-cell is-out"></div>';
      for (var day = 1; day <= days; day++) {
        var iso = cal.ym + '-' + String(day).padStart(2, '0');
        var mine = d.meetings.filter(function (x) { return x.on === iso; });
        var shown = mine.slice(0, 2);
        cells += '<button class="bx-cell' + (iso === d.today ? ' is-today' : '') +
          (iso === cal.pick ? ' is-pick' : '') + '" data-day="' + iso + '">' +
          '<span class="bx-cell__d bx-mono">' + day + '</span>' +
          shown.map(function (x) {
            return '<span class="bx-ev is-' + BIX.typeTone(x.type) + '">' + H.esc(x.title) + '</span>';
          }).join('') +
          (mine.length > 2 ? '<span class="bx-ev__more bx-mono">+' + (mine.length - 2) + ' more</span>' : '') +
        '</button>';
      }

      var agenda = d.meetings.filter(function (x) { return x.on === cal.pick; })
        .sort(function (a, b) { return a.at < b.at ? -1 : 1; });

      return '' +
      '<div class="bx-sec"><div class="bx-sec__h">' +
        '<div class="bx-monthnav">' +
          '<button class="bx-iconbtn" id="calPrev" aria-label="Previous month">' + I('chevL') + '</button>' +
          '<span class="bx-monthnav__l bx-mono">' + H.esc(label) + '</span>' +
          '<button class="bx-iconbtn" id="calNext" aria-label="Next month">' + I('chevR') + '</button>' +
        '</div>' +
        '<button class="bx-btn bx-btn--primary bx-btn--sm" data-act="meeting">' + I('plus') + ' Schedule</button>' +
      '</div>' +

      '<div class="bx-split bx-split--cal">' +
        '<section class="bx-card"><div class="bx-card__body">' +
          '<div class="bx-week bx-mono">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (w) {
            return '<span>' + w + '</span>';
          }).join('') + '</div>' +
          '<div class="bx-cal">' + cells + '</div>' +
        '</div></section>' +

        '<section class="bx-card">' +
          '<div class="bx-card__head"><h3>' + H.date(cal.pick, 'long') + '</h3>' +
            '<span class="bx-card__head-r bx-mono">' + agenda.length + '</span></div>' +
          '<div class="bx-card__body">' + (agenda.length ? agenda.map(function (x) {
            return '<div class="bx-slot"><span class="bx-slot__t bx-mono">' + H.esc(x.at) + '</span>' +
              '<span class="bx-slot__b"><span class="bx-slot__n">' + H.esc(x.title) + '</span>' +
              '<span class="bx-slot__w">' + H.esc(x.who) + ' · ' + x.mins + ' min</span></span>' +
              '<span class="bx-slot__r"><span class="bx-pill bx-pill--' + BIX.typeTone(x.type) + '">' + H.esc(x.type) + '</span>' +
              (x.link ? '<a class="bx-linkish" href="' + H.esc(x.link) + '" target="_blank" rel="noopener" data-go-skip>Join</a>' : '') +
              '</span></div>';
          }).join('') : H.empty('calendar', 'Nothing scheduled', 'Pick another day, or schedule something.')) +
          '</div></section>' +
      '</div></div>';
    },

    mount: function (el) {
      el.querySelector('#calPrev').addEventListener('click', function () {
        cal.ym = ymShift(cal.ym, -1); BIX.app.rerender();
      });
      el.querySelector('#calNext').addEventListener('click', function () {
        cal.ym = ymShift(cal.ym, 1); BIX.app.rerender();
      });
      el.querySelectorAll('[data-day]').forEach(function (b) {
        b.addEventListener('click', function () { cal.pick = b.getAttribute('data-day'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-act="meeting"]').forEach(function (b) {
        b.addEventListener('click', function () { BIX.actions.meeting(); });
      });
    }
  };

  BIX.actions.meeting = function () {
    var d = BIX.data;
    BIX.modal({
      title: 'Schedule',
      body:
        '<div class="bx-field"><label for="smT">Title</label><input id="smT" placeholder="e.g. Discovery call" /></div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="smK">Type</label><select id="smK">' +
            '<option>Discovery</option><option>Sales</option><option>Check-in</option><option>Internal</option></select></div>' +
          '<div class="bx-field"><label for="smW">Attendee</label><input id="smW" placeholder="Name · Business" /></div>' +
        '</div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="smD">Date</label><input id="smD" type="date" value="' + cal.pick + '" /></div>' +
          '<div class="bx-field"><label for="smH">Time</label><input id="smH" type="time" value="10:00" /></div>' +
        '</div>' +
        '<div class="bx-field"><label for="smM">Duration (minutes)</label><select id="smM">' +
          '<option>15</option><option selected>30</option><option>45</option><option>60</option></select></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="smSave">Schedule</button>',
      mount: function (w) {
        w.querySelector('#smSave').addEventListener('click', function () {
          var t = w.querySelector('#smT').value.trim();
          if (!t) { BIX.toast('Give the meeting a title'); return; }
          var on = w.querySelector('#smD').value || d.today;
          d.meetings.push({
            id: 'm-' + Date.now(), title: t, type: w.querySelector('#smK').value,
            on: on, at: w.querySelector('#smH').value || '10:00',
            mins: Number(w.querySelector('#smM').value), who: w.querySelector('#smW').value.trim() || '—', link: ''
          });
          cal.ym = on.slice(0, 7); cal.pick = on;
          BIX.closeModal();
          BIX.app.go('calendar');
          BIX.toast(t + ' scheduled');
        });
      }
    });
  };

  /* =============================== SETTINGS =============================== */
  var toggles = [
    { id: 'tg-lead', label: 'New lead captured', sub: 'Email me when a lead lands', on: true },
    { id: 'tg-pay', label: 'Payment received', sub: 'Email me when an invoice is settled', on: true },
    { id: 'tg-late', label: 'Invoice goes overdue', sub: 'Alert at day 1 and day 14', on: true },
    { id: 'tg-health', label: 'Client health drops', sub: 'Alert when health falls below 60', on: false },
    { id: 'tg-week', label: 'Weekly digest', sub: 'Monday summary of pipeline and revenue', on: true }
  ];
  var integrations = [
    { id: 'ig-supabase', name: 'Supabase', what: 'Client portal database & auth', status: 'Connected' },
    { id: 'ig-resend', name: 'Resend', what: 'Transactional & campaign email', status: 'Connected' },
    { id: 'ig-stripe', name: 'Stripe', what: 'Invoicing and card payments', status: 'Connected' },
    { id: 'ig-calendly', name: 'Calendly', what: 'Discovery call scheduling', status: 'Connected' },
    { id: 'ig-twilio', name: 'Twilio', what: 'SMS reminders and campaigns', status: 'Pending' }
  ];

  var SECTIONS = [
    { id: 'st-agency', label: 'Agency' }, { id: 'st-team', label: 'Team' },
    { id: 'st-notif', label: 'Notifications' }, { id: 'st-integ', label: 'Integrations' },
    { id: 'st-bill', label: 'Billing' }
  ];

  BIX.views.settings = {
    render: function () {
      var d = BIX.data;
      return '<div class="bx-set">' +
        '<nav class="bx-set__rail" aria-label="Settings sections">' + SECTIONS.map(function (s) {
          return '<a class="bx-set__link" href="#' + s.id + '" data-sec="' + s.id + '" data-go-skip>' + H.esc(s.label) + '</a>';
        }).join('') + '</nav>' +
        '<div class="bx-stack">' +

        '<section class="bx-card" id="st-agency"><div class="bx-card__head"><h3>Agency</h3></div>' +
          '<div class="bx-card__body">' +
            '<div class="bx-row2">' +
              '<div class="bx-field"><label for="sgN">Agency name</label><input id="sgN" value="' + H.esc(d.agency.name) + '" /></div>' +
              '<div class="bx-field"><label for="sgE">Contact email</label><input id="sgE" type="email" value="' + H.esc(d.agency.email) + '" /></div>' +
            '</div>' +
            '<div class="bx-field"><label for="sgT">Timezone</label><select id="sgT">' +
              ['America/Chicago', 'America/Jamaica', 'America/New_York', 'UTC'].map(function (t) {
                return '<option' + (t === d.agency.timezone ? ' selected' : '') + '>' + H.esc(t) + '</option>';
              }).join('') + '</select></div>' +
          '</div><div class="bx-card__foot"><button class="bx-btn bx-btn--primary bx-btn--sm" data-save="Agency">Save</button></div></section>' +

        '<section class="bx-card" id="st-team"><div class="bx-card__head"><h3>Team</h3>' +
          '<button class="bx-btn bx-btn--ghost bx-btn--sm bx-card__head-r" id="stInvite">' + I('plus') + ' Invite</button></div>' +
          '<div class="bx-card__body"><div class="bx-team">' + d.team.map(function (m) {
            return '<div class="bx-person"><span class="bx-avatar">' + H.esc(m.initials) + '</span>' +
              '<div><div class="bx-person__n">' + H.esc(m.name) + '</div>' +
              '<div class="bx-person__r bx-mono">' + H.esc(m.role) + '</div></div>' +
              (m.id === 'sw' ? '<span class="bx-pill bx-pill--purple">You</span>'
                : '<button class="bx-btn bx-btn--danger bx-btn--sm" data-drop-member="' + H.esc(m.id) + '">Remove</button>') +
              '</div>';
          }).join('') + '</div></div></section>' +

        '<section class="bx-card" id="st-notif"><div class="bx-card__head"><h3>Notifications</h3></div>' +
          '<div class="bx-card__body">' + toggles.map(function (t) {
            return '<div class="bx-togrow"><div><div class="bx-togrow__t">' + H.esc(t.label) + '</div>' +
              '<div class="bx-togrow__s">' + H.esc(t.sub) + '</div></div>' +
              '<button class="bx-switch' + (t.on ? ' is-on' : '') + '" role="switch" aria-checked="' + t.on + '" ' +
                'data-tog="' + H.esc(t.id) + '" aria-label="' + H.esc(t.label) + '"></button></div>';
          }).join('') + '</div>' +
          '<div class="bx-card__foot"><button class="bx-btn bx-btn--primary bx-btn--sm" data-save="Notification">Save</button></div></section>' +

        '<section class="bx-card" id="st-integ"><div class="bx-card__head"><h3>Integrations</h3></div>' +
          '<div class="bx-card__body">' + integrations.map(function (g) {
            return '<div class="bx-togrow"><div class="bx-integ">' +
              '<span class="bx-integ__m">' + H.esc(g.name.slice(0, 2).toUpperCase()) + '</span>' +
              '<div><div class="bx-togrow__t">' + H.esc(g.name) + '</div>' +
              '<div class="bx-togrow__s">' + H.esc(g.what) + '</div></div></div>' +
              '<span class="bx-integ__r">' + H.pill(g.status) +
              '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-integ="' + H.esc(g.id) + '">' +
                (g.status === 'Connected' ? 'Disconnect' : 'Connect') + '</button></span></div>';
          }).join('') + '</div></section>' +

        '<section class="bx-card" id="st-bill"><div class="bx-card__head"><h3>Billing</h3></div>' +
          '<div class="bx-card__body">' +
            '<div class="bx-drow"><span class="bx-drow__k bx-mono">Plan</span><span class="bx-drow__v">Bix internal · unlimited seats</span></div>' +
            '<div class="bx-drow"><span class="bx-drow__k bx-mono">Payment method</span><span class="bx-drow__v">Visa •••• 4417</span></div>' +
            '<div class="bx-drow"><span class="bx-drow__k bx-mono">Next charge</span><span class="bx-drow__v">—</span></div>' +
          '</div>' +
          '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-save="Billing">Update card</button></div></section>' +

        '</div></div>';
    },

    mount: function (el) {
      el.querySelectorAll('[data-sec]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var t = el.querySelector('#' + a.getAttribute('data-sec'));
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.toggle('is-on', x === a); });
        });
      });
      el.querySelectorAll('[data-save]').forEach(function (b) {
        b.addEventListener('click', function () { BIX.toast(b.getAttribute('data-save') + ' settings saved'); });
      });
      el.querySelectorAll('[data-tog]').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = toggles.filter(function (x) { return x.id === b.getAttribute('data-tog'); })[0];
          t.on = !t.on;
          b.classList.toggle('is-on', t.on);
          b.setAttribute('aria-checked', String(t.on));
        });
      });
      el.querySelectorAll('[data-integ]').forEach(function (b) {
        b.addEventListener('click', function () {
          var g = integrations.filter(function (x) { return x.id === b.getAttribute('data-integ'); })[0];
          g.status = g.status === 'Connected' ? 'Pending' : 'Connected';
          BIX.app.rerender();
          BIX.toast(g.name + ' ' + (g.status === 'Connected' ? 'connected' : 'disconnected'));
        });
      });
      el.querySelectorAll('[data-drop-member]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-drop-member');
          var m = H.member(id);
          BIX.modal({
            title: 'Remove ' + m.name + '?',
            body: '<p class="bx-hero__s">They lose access to the console immediately. Work they are assigned to stays put.</p>',
            foot: '<button class="bx-btn bx-btn--ghost" data-close>Keep</button>' +
                  '<button class="bx-btn bx-btn--danger" id="rmGo">Remove</button>',
            mount: function (w) {
              w.querySelector('#rmGo').addEventListener('click', function () {
                BIX.data.team = BIX.data.team.filter(function (x) { return x.id !== id; });
                BIX.closeModal(); BIX.app.rerender();
                BIX.toast(m.name + ' removed');
              });
            }
          });
        });
      });
      el.querySelector('#stInvite').addEventListener('click', function () {
        BIX.modal({
          title: 'Invite teammate',
          body: '<div class="bx-field"><label for="ivN">Name</label><input id="ivN" placeholder="Full name" /></div>' +
            '<div class="bx-field"><label for="ivE">Email</label><input id="ivE" type="email" placeholder="name@bixllc.net" /></div>' +
            '<div class="bx-field"><label for="ivR">Role</label><input id="ivR" placeholder="e.g. Design & content" /></div>',
          foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
                '<button class="bx-btn bx-btn--primary" id="ivGo">Send invite</button>',
          mount: function (w) {
            w.querySelector('#ivGo').addEventListener('click', function () {
              var n = w.querySelector('#ivN').value.trim();
              if (!n) { BIX.toast('Give them a name'); return; }
              BIX.data.team.push({
                id: 't-' + Date.now(), name: n,
                role: w.querySelector('#ivR').value.trim() || 'Team',
                email: w.querySelector('#ivE').value.trim() || '—',
                initials: H.initials(n)
              });
              BIX.closeModal(); BIX.app.rerender();
              BIX.toast('Invite sent to ' + n);
            });
          }
        });
      });
    }
  };
})();
