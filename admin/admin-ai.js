/* ==========================================================================
   admin-ai.js — internal assistant.

   Feature-flagged off at launch. While 'ai' sits in BIX.hidden this module
   registers nothing: no FAB, no view, no data-ai buttons anywhere in the DOM.
   The guard is at the top so there is never a half-mounted surface to hide
   with CSS later.
   ========================================================================== */
(function () {
  'use strict';

  if (BIX.isHidden('ai')) return;

  var H = BIX.h;

  /* Canned responses. When this ships for real the send handler is the only
     thing that changes — everything below is the surface it renders into. */
  var CANNED = [
    { q: /overdue|chase|late/i, a: function () {
        var od = BIX.data.invoices.filter(function (i) { return i.status === 'Overdue'; });
        if (!od.length) return 'Nothing is overdue right now.';
        return 'Two accounts are past due: ' + od.map(function (i) {
          return i.client + ' (' + BIX.money0(i.amount) + ')';
        }).join(' and ') + '. Want me to draft the escalation note?';
      } },
    { q: /risk|health|churn/i, a: function () {
        var low = BIX.data.clients.slice().sort(function (a, b) { return a.health - b.health; }).slice(0, 3);
        return 'Lowest health: ' + low.map(function (c) { return c.business + ' (' + c.health + ')'; }).join(', ') + '.';
      } },
    { q: /pipeline|leads|forecast/i, a: function () {
        var t = BIX.data.totals;
        return t.openLeads + ' open leads worth ' + BIX.money0(t.pipeline) +
          ', averaging ' + BIX.money0(t.avgDeal) + ' a deal.';
      } }
  ];

  function reply(q) {
    for (var i = 0; i < CANNED.length; i++) if (CANNED[i].q.test(q)) return CANNED[i].a();
    return 'I can answer on pipeline, client health and overdue invoices so far.';
  }

  var log = [{ from: 'ai', body: 'Ask me about pipeline, client health or overdue invoices.' }];

  BIX.views.ai = {
    wide: true,
    render: function () {
      return '<section class="bx-card bx-card--pad">' +
        '<div class="bx-ai__log" id="aiLog">' + log.map(function (m) {
          return '<div class="bx-ai__msg bx-ai__msg--' + m.from + '">' + H.esc(m.body) + '</div>';
        }).join('') + '</div>' +
        '<form class="bx-ai__form" id="aiForm">' +
          '<input id="aiQ" placeholder="Ask about the business…" aria-label="Ask the assistant" />' +
          '<button class="bx-btn bx-btn--primary" type="submit">Ask</button>' +
        '</form></section>';
    },
    mount: function (el) {
      el.querySelector('#aiForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var q = el.querySelector('#aiQ').value.trim();
        if (!q) return;
        log.push({ from: 'me', body: q });
        log.push({ from: 'ai', body: reply(q) });
        BIX.app.rerender();
      });
    }
  };
})();
