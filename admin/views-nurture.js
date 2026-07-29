/* ==========================================================================
   views-nurture.js — channel performance, campaigns, sequences, templates
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;

  /* Channels are gated the same way nav items are: a channel tied to a hidden
     feature must not appear as a card, a table row or a composer tab. */
  function channels() {
    return BIX.data.channels.filter(function (c) { return !BIX.isHidden(c.id); });
  }
  function channelOk(id) {
    return channels().some(function (c) { return c.id === id; });
  }
  BIX.channels = channels;
  BIX.channelOk = channelOk;

  function chanMeta(id) {
    return BIX.data.channels.filter(function (c) { return c.id === id; })[0] ||
      { label: id, icon: 'send' };
  }

  BIX.views.nurture = {
    wide: true,
    render: function () {
      var d = BIX.data;
      var live = channels();
      var reached = live.reduce(function (a, c) { return a + c.sent; }, 0);
      var camps = d.campaigns.filter(function (c) { return channelOk(c.channel); });
      var opens = camps.filter(function (c) { return c.sent && c.channel === 'email'; });
      var avgOpen = opens.length ? opens.reduce(function (a, c) { return a + c.open; }, 0) / opens.length : 0;
      var replies = camps.reduce(function (a, c) { return a + c.replies; }, 0);

      return '' +
      '<div class="bx-stats bx-stats--3">' +
        H.stat({ k: 'Contacts reached', v: reached.toLocaleString('en-US'), icon: 'users', tone: 'purple' }) +
        H.stat({ k: 'Avg open rate', v: BIX.pct(avgOpen), icon: 'inbox', tone: 'blue' }) +
        H.stat({ k: 'Replies this month', v: replies, icon: 'send', tone: 'green' }) +
      '</div>' +

      /* ---- channel performance ---- */
      '<div class="bx-sec"><div class="bx-sec__h"><h3>Channels</h3>' +
        '<button class="bx-btn bx-btn--primary bx-btn--sm" id="nuNew">' + I('plus') + ' New message</button></div>' +
        '<div class="bx-qas" style="' + H.autoCols(live.length, 3) + '">' + live.map(function (c) {
          return '<div class="bx-chan">' +
            '<span class="bx-chan__ico">' + I(c.icon) + '</span>' +
            '<div class="bx-chan__n">' + H.esc(c.label) + '</div>' +
            '<div class="bx-chan__v">' + BIX.pct(c.rate) + '</div>' +
            '<div class="bx-chan__k bx-mono">' + H.esc(c.rateLabel) + ' · ' + c.sent.toLocaleString('en-US') + ' sent</div>' +
          '</div>';
        }).join('') + '</div></div>' +

      /* ---- campaigns ---- */
      '<div class="bx-sec"><div class="bx-sec__h"><h3>Campaigns</h3>' +
        '<span class="bx-mono bx-faint">' + camps.length + ' total</span></div>' +
        (camps.length ? '<div class="bx-table__wrap"><table class="bx-table">' +
          '<thead><tr><th scope="col">Campaign</th><th scope="col" class="c-src">Channel</th>' +
          '<th scope="col" class="c-ind">Audience</th><th scope="col" class="num c-own">Size</th>' +
          '<th scope="col" class="num c-own">Sent</th><th scope="col" class="num">Open</th>' +
          '<th scope="col" class="num c-st">Click</th><th scope="col" class="num c-st">Replies</th>' +
          '<th scope="col">Status</th><th scope="col" class="c-tou">Date</th></tr></thead><tbody>' +
          camps.map(function (c) {
            var m = chanMeta(c.channel);
            return '<tr data-camp="' + H.esc(c.id) + '" tabindex="0">' +
              '<td><span class="bx-table__name">' + H.esc(c.name) + '</span></td>' +
              '<td class="c-src"><span class="bx-inline">' + I(m.icon) + ' ' + H.esc(m.label) + '</span></td>' +
              '<td class="c-ind">' + H.esc(c.audience) + '</td>' +
              '<td class="num c-own bx-mono">' + c.size + '</td>' +
              '<td class="num c-own bx-mono">' + c.sent + '</td>' +
              '<td class="num bx-mono">' + (c.sent ? BIX.pct(c.open) : '—') + '</td>' +
              '<td class="num c-st bx-mono">' + (c.sent ? BIX.pct(c.click) : '—') + '</td>' +
              '<td class="num c-st bx-mono">' + c.replies + '</td>' +
              '<td>' + H.pill(c.status) + '</td>' +
              '<td class="c-tou bx-mono">' + H.date(c.date, 'short') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : H.empty('send', 'No campaigns yet', 'Start one from a template below.')) +
      '</div>' +

      /* ---- sequences ---- */
      '<div class="bx-sec"><div class="bx-sec__h"><h3>Sequences</h3>' +
        '<span class="bx-mono bx-faint">' + d.sequences.length + ' drips</span></div>' +
        '<div class="bx-stack">' + d.sequences.map(function (s) {
          var steps = s.steps.filter(function (st) { return channelOk(st.channel); });
          return '<section class="bx-card bx-card--pad">' +
            '<div class="bx-seqh"><div><div class="bx-seqh__n">' + H.esc(s.name) + '</div>' +
              '<div class="bx-seqh__m bx-mono">' + s.enrolled + ' enrolled</div></div>' +
              H.pill(s.status) + '</div>' +
            '<ol class="bx-step">' + steps.map(function (st, i) {
              var m = chanMeta(st.channel);
              return '<li class="bx-step__i">' +
                '<span class="bx-step__n">' + (i + 1) + '</span>' +
                '<span class="bx-step__d bx-mono">Day ' + st.day + '</span>' +
                '<span class="bx-step__t">' + I(m.icon) + ' ' + H.esc(st.title) + '</span></li>';
            }).join('') + '</ol></section>';
        }).join('') + '</div></div>' +

      /* ---- templates ---- */
      '<div class="bx-sec"><div class="bx-sec__h"><h3>Templates</h3>' +
        '<span class="bx-mono bx-faint">' + d.templates.length + ' saved</span></div>' +
        '<div class="bx-tpls">' + d.templates.map(function (t) {
          return '<article class="bx-tpl">' +
            '<div class="bx-tpl__strip is-' + H.esc(t.accent) + '"></div>' +
            '<div class="bx-tpl__b">' +
              '<div class="bx-tpl__n">' + H.esc(t.name) + '</div>' +
              '<p class="bx-tpl__d">' + H.esc(t.desc) + '</p>' +
              '<div class="bx-tpl__f"><span class="bx-pill bx-pill--neutral">' + H.esc(t.category) + '</span>' +
                '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-tpl="' + H.esc(t.id) + '">Use template</button></div>' +
            '</div></article>';
        }).join('') + '</div></div>';
    },

    mount: function (el) {
      el.querySelector('#nuNew').addEventListener('click', function () { BIX.composer({}); });

      el.querySelectorAll('[data-camp]').forEach(function (tr) {
        function open() { campaignModal(tr.getAttribute('data-camp')); }
        tr.addEventListener('click', open);
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      });

      el.querySelectorAll('[data-tpl]').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = BIX.data.templates.filter(function (x) { return x.id === b.getAttribute('data-tpl'); })[0];
          if (t) BIX.composer({ subject: t.subject, body: t.body, template: t.name });
        });
      });
    }
  };

  function campaignModal(id) {
    var c = BIX.data.campaigns.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var m = chanMeta(c.channel);
    BIX.modal({
      title: c.name,
      body:
        '<div class="bx-dhero">' +
          '<div><div class="bx-dhero__k bx-mono">Channel</div><div class="bx-dhero__v is-plan">' + H.esc(m.label) + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Sent</div><div class="bx-dhero__v">' + c.sent + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">' + (c.channel === 'email' ? 'Open' : 'Delivered') + '</div>' +
            '<div class="bx-dhero__v">' + (c.sent ? BIX.pct(c.open) : '—') + '</div></div>' +
        '</div>' +
        '<div class="bx-drow"><span class="bx-drow__k bx-mono">Audience</span>' +
          '<span class="bx-drow__v">' + H.esc(c.audience) + ' · ' + c.size + ' contacts</span></div>' +
        '<div class="bx-drow"><span class="bx-drow__k bx-mono">Status</span>' +
          '<span class="bx-drow__v">' + H.pill(c.status) + '</span></div>' +
        (c.subject ? '<div class="bx-preview2"><div class="bx-preview2__s">' + H.esc(c.subject) + '</div>' +
          '<div class="bx-preview2__b">' + H.esc(c.body).replace(/\n/g, '<br>') + '</div></div>'
          : '<div class="bx-preview2"><div class="bx-preview2__b">' + H.esc(c.body).replace(/\n/g, '<br>') + '</div></div>'),
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>' +
            '<button class="bx-btn bx-btn--primary" id="cpDup">Duplicate into composer</button>',
      mount: function (w) {
        w.querySelector('#cpDup').addEventListener('click', function () {
          BIX.composer({ subject: c.subject, body: c.body, channel: c.channel });
        });
      }
    });
  }
})();
