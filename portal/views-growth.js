/* ==========================================================================
   Views: analytics, support, settings
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon, stat = BIX.stat;

  /* ============================== ANALYTICS ============================== */
  var range = 30;

  function delta(n) {
    var up = n >= 0;
    return '<div class="bx-stat__d ' + (up ? 'is-up' : 'is-down') + '">' +
      (up ? '▲ ' : '▼ ') + Math.abs(n) + '% vs previous</div>';
  }

  /* Hand-rolled area chart. viewBox units, so it scales without canvas. */
  function chart(points) {
    var W = 720, Hh = 220, pad = { l: 8, r: 8, t: 14, b: 22 };
    var iw = W - pad.l - pad.r, ih = Hh - pad.t - pad.b;
    var max = Math.max.apply(null, points.map(function (p) { return p.v; })) * 1.12;
    var step = iw / (points.length - 1);

    var xy = points.map(function (p, i) {
      return { x: pad.l + i * step, y: pad.t + ih - (p.v / max) * ih, v: p.v, d: p.d };
    });
    var line = xy.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
    var area = line + ' L' + xy[xy.length - 1].x.toFixed(1) + ' ' + (pad.t + ih) + ' L' + pad.l + ' ' + (pad.t + ih) + ' Z';

    var grid = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
      var y = pad.t + ih * f;
      return '<line class="bx-chart__grid" x1="' + pad.l + '" y1="' + y + '" x2="' + (W - pad.r) + '" y2="' + y + '"/>';
    }).join('');

    var every = Math.ceil(points.length / 6);
    var labels = xy.map(function (p, i) {
      if (i % every !== 0 && i !== xy.length - 1) return '';
      return '<text class="bx-chart__lbl" x="' + p.x + '" y="' + (Hh - 5) + '" text-anchor="middle">' +
        H.date(p.d).replace(/, \d+$/, '') + '</text>';
    }).join('');

    return '<div style="position:relative">' +
      '<svg class="bx-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" ' +
        'aria-label="Visitors over the last ' + points.length + ' days, from ' +
        points[0].v + ' to ' + points[points.length - 1].v + ' per day.">' +
        '<defs><linearGradient id="bxArea" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#442061" stop-opacity=".26"/>' +
          '<stop offset="100%" stop-color="#442061" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        grid +
        '<path d="' + area + '" fill="url(#bxArea)"/>' +
        '<path class="bx-chart__line" d="' + line + '"/>' +
        labels +
        '<g class="bx-cross" id="bxCross" style="display:none">' +
          '<line y1="' + pad.t + '" y2="' + (pad.t + ih) + '"/><circle r="4"/></g>' +
        '<rect class="bx-chart__hit" id="bxHit" x="0" y="0" width="' + W + '" height="' + Hh + '"/>' +
      '</svg>' +
      '<div class="bx-tip" id="bxTip" hidden></div>' +
      '<p class="bx-sr">Daily visitor counts for the selected range.</p>' +
    '</div>';
  }

  BIX.views.analytics = {
    wide: true,
    render: function () {
      var a = BIX.data.analytics;

      /* No analytics wired up yet — say so rather than rendering NaN. */
      if (!a.visitors.length) {
        return '<div class="bx-card bx-card--pad">' +
          H.empty('chart', 'No analytics yet',
            'Once traffic tracking is connected to your site, visitors, leads and ' +
            'conversion will appear here.',
            '<button class="bx-btn bx-btn--ghost" data-go="website">View site health</button>') +
        '</div>';
      }

      var vis = a.visitors.slice(-range);
      var leads = a.leads.slice(-range);
      var totalVis = vis.reduce(function (s, p) { return s + p.v; }, 0);
      var totalLeads = leads.reduce(function (s, p) { return s + p.v; }, 0);
      var conv = (totalLeads / totalVis * 100).toFixed(1);
      var rev = Math.round(BIX.data.analytics.revenue * (range / 30));

      return '' +
      '<div class="bx-stats">' +
        stat('purple', 'chart', 'Visitors',           totalVis.toLocaleString(), delta(a.deltas.visitors)) +
        stat('blue',   'user',  'Leads',              totalLeads.toLocaleString(), delta(a.deltas.leads)) +
        stat('green',  'zap',   'Conversion rate',    conv + '%', delta(a.deltas.conv)) +
        stat('amber',  'card',  'Revenue attributed', H.money(rev), delta(a.deltas.revenue)) +
      '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h"><h2>Traffic</h2>' +
        '<div class="bx-seg" id="anRange">' + [7, 30, 90].map(function (r) {
          return '<button class="bx-seg__b' + (r === range ? ' is-on' : '') + '" data-r="' + r + '">' + r + 'd</button>';
        }).join('') + '</div></div>' +

        '<div class="bx-split">' +
          '<div class="bx-card"><div class="bx-card__head"><h3>Visitors</h3>' +
            '<div class="bx-card__head-r"><span class="bx-mono bx-faint">last ' + range + ' days</span></div></div>' +
            '<div class="bx-card__body">' + chart(vis) + '</div></div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Where they come from</h3></div>' +
            '<div class="bx-card__body">' + BIX.data.analytics.sources.map(function (s) {
              return '<div class="bx-src"><span class="bx-src__n">' + H.esc(s.name) + '</span>' +
                '<span class="bx-src__bar"><span class="bx-bar"><span class="bx-bar__f" style="width:' + s.pct + '%"></span></span></span>' +
                '<span class="bx-src__p">' + s.pct + '%</span></div>';
            }).join('') + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="bx-sec"><div class="bx-card">' +
        '<div class="bx-card__head"><h3>Top pages</h3></div>' +
        '<div class="bx-table__wrap"><table class="bx-table"><thead><tr>' +
          '<th scope="col">Page</th><th scope="col" class="bx-r">Views</th>' +
          '<th scope="col" class="bx-r bx-drop-col">Avg. time</th>' +
          '<th scope="col" class="bx-r bx-drop-col">Conversion</th></tr></thead><tbody>' +
          BIX.data.analytics.topPages.map(function (p) {
            return '<tr><td class="bx-table__name bx-num">' + H.esc(p.path) + '</td>' +
              '<td class="bx-r">' + p.views.toLocaleString() + '</td>' +
              '<td class="bx-r bx-drop-col">' + H.esc(p.avg) + '</td>' +
              '<td class="bx-r bx-drop-col">' + H.esc(p.conv) + '</td></tr>';
          }).join('') +
        '</tbody></table></div></div></div>';
    },

    mount: function (el) {
      el.querySelectorAll('#anRange .bx-seg__b').forEach(function (b) {
        b.addEventListener('click', function () { range = +b.getAttribute('data-r'); BIX.app.rerender(); });
      });

      var svg = el.querySelector('.bx-chart');
      var hit = el.querySelector('#bxHit');
      var cross = el.querySelector('#bxCross');
      var tip = el.querySelector('#bxTip');
      if (!svg || !hit) return;

      var pts = BIX.data.analytics.visitors.slice(-range);
      var W = 720, pad = 8, iw = W - 16, step = iw / (pts.length - 1);

      hit.addEventListener('mousemove', function (e) {
        var r = svg.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width * W;
        var i = Math.max(0, Math.min(pts.length - 1, Math.round((x - pad) / step)));
        var max = Math.max.apply(null, pts.map(function (p) { return p.v; })) * 1.12;
        var px = pad + i * step;
        var py = 14 + (220 - 14 - 22) - (pts[i].v / max) * (220 - 14 - 22);

        cross.style.display = '';
        cross.querySelector('line').setAttribute('x1', px);
        cross.querySelector('line').setAttribute('x2', px);
        cross.querySelector('circle').setAttribute('cx', px);
        cross.querySelector('circle').setAttribute('cy', py);

        tip.hidden = false;
        tip.textContent = pts[i].v + ' visitors · ' + H.date(pts[i].d);
        tip.style.left = (px / W * r.width) + 'px';
        tip.style.top = (py / 220 * r.height) + 'px';
      });
      hit.addEventListener('mouseleave', function () {
        cross.style.display = 'none';
        tip.hidden = true;
      });
    }
  };

  /* =============================== SUPPORT =============================== */
  BIX.views.support = {
    render: function () {
      var d = BIX.data;

      return '' +
      '<div class="bx-split">' +

        '<div class="bx-card">' +
          '<div class="bx-card__head"><h3>Your tickets</h3>' +
            '<div class="bx-card__head-r">' +
              '<span class="bx-pill bx-pill--amber">' +
                d.tickets.filter(function (t) { return t.status !== 'Completed'; }).length + ' open</span>' +
            '</div></div>' +
          '<div class="bx-table__wrap">' + (d.tickets.length ?
            '<table class="bx-table"><thead><tr><th scope="col">ID</th><th scope="col">Subject</th>' +
            '<th scope="col" class="bx-drop-col">Opened</th><th scope="col">Status</th></tr></thead><tbody>' +
            d.tickets.map(function (t) {
              return '<tr><td class="bx-num bx-faint">' + H.esc(t.id) + '</td>' +
                '<td class="bx-table__name">' + H.esc(t.subject) + '</td>' +
                '<td class="bx-drop-col bx-num bx-faint">' + H.date(t.opened) + '</td>' +
                '<td>' + H.pill(t.status) + '</td></tr>';
            }).join('') + '</tbody></table>'
            : H.empty('ticket', 'No tickets yet', 'Anything you send us will show up here.')) +
          '</div></div>' +

        '<div class="bx-card">' +
          '<div class="bx-card__head"><h3>Send us a message</h3></div>' +
          '<div class="bx-card__body">' +
            '<p class="bx-mini__s" style="margin-bottom:14px">Something broken, or just a question? ' +
              'Send it over and we will come back to you — usually the same day.</p>' +
            '<div class="bx-field"><label for="spS">Subject</label>' +
              '<input id="spS" placeholder="What is this about?" /></div>' +
            '<div class="bx-field"><label for="spM">Message</label>' +
              '<textarea id="spM" placeholder="Tell us what is going on."></textarea></div>' +
            '<button class="bx-btn bx-btn--primary bx-btn--block" id="spSend">Send message</button>' +
          '</div></div>' +

      '</div>';
    },

    mount: function (el) {
      el.querySelector('#spSend').addEventListener('click', function () {
        var subj = el.querySelector('#spS').value.trim();
        var body = el.querySelector('#spM').value.trim();
        if (!subj) { el.querySelector('#spS').focus(); BIX.toast('Give your message a subject'); return; }

        var btn = el.querySelector('#spSend');
        btn.disabled = true;
        BIX.api.addTicket(body ? subj + ' — ' + body : subj).then(function (res) {
          if (res.error) { btn.disabled = false; BIX.toast(res.error.message); return; }
          return BIX.api.loadFor(BIX.api.viewingId).then(function () {
            BIX.app.rerender();
            BIX.toast('Message sent — we will be in touch');
          });
        });
      });
    }
  };

  /* =============================== SETTINGS ============================== */
  BIX.views.settings = {
    render: function () {
      var c = BIX.data.client;
      var toggles = [
        { k: 'Project updates',   s: 'When a phase moves or something ships',      on: true },
        { k: 'New invoices',      s: 'When an invoice is issued or falls due',      on: true },
        { k: 'Request activity',  s: 'Replies and status changes on your requests', on: true },
        { k: 'Monthly report',    s: 'Your performance summary, first of the month', on: false },
        { k: 'Product news',      s: 'Occasional notes about new portal features',  on: false }
      ];

      function card(id, title, body, btn) {
        return '<div class="bx-card" id="' + id + '" style="scroll-margin-top:90px">' +
          '<div class="bx-card__head"><h3>' + H.esc(title) + '</h3></div>' +
          '<div class="bx-card__body">' + body + '</div>' +
          '<div class="bx-card__foot"><button class="bx-btn bx-btn--primary bx-btn--sm" data-save="' + H.esc(title) + '">' +
            H.esc(btn || 'Save changes') + '</button></div></div>';
      }

      return '<div class="bx-set">' +
        '<div class="bx-set__rail" id="setRail">' +
          [['profile','Profile'],['business','Business'],['notif','Notifications'],['security','Security'],['billing','Billing']]
            .map(function (s, i) {
              return '<button class="bx-set__link' + (i === 0 ? ' is-on' : '') + '" data-sec="' + s[0] + '">' + s[1] + '</button>';
            }).join('') +
        '</div>' +

        '<div class="bx-stack">' +
          card('profile', 'Profile',
            '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">' +
              '<span class="bx-person__a" style="width:52px;height:52px;font-size:16px">' + H.esc(c.initials) + '</span>' +
              '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-save="Photo">Change photo</button></div>' +
            '<div class="bx-row2">' +
              '<div class="bx-field"><label for="stN">Full name</label><input id="stN" value="' + H.esc(c.name) + '" /></div>' +
              '<div class="bx-field"><label for="stE">Email</label><input id="stE" type="email" value="' + H.esc(c.email) + '" /></div>' +
            '</div>' +
            '<div class="bx-field"><label for="stP">Phone</label><input id="stP" value="' + H.esc(c.phone) + '" /></div>') +

          card('business', 'Business',
            '<div class="bx-row2">' +
              '<div class="bx-field"><label for="stB">Business name</label><input id="stB" value="' + H.esc(c.business) + '" /></div>' +
              '<div class="bx-field"><label for="stI">Industry</label><input id="stI" value="' + H.esc(c.industry) + '" /></div>' +
            '</div>' +
            '<div class="bx-field"><label for="stA">Address</label><input id="stA" value="' + H.esc(c.address) + '" /></div>' +
            '<div class="bx-field"><label for="stZ">Timezone</label><input id="stZ" value="' + H.esc(c.timezone) + '" /></div>') +

          card('notif', 'Notifications',
            toggles.map(function (t, i) {
              return '<div class="bx-togrow"><div><div class="bx-togrow__t">' + H.esc(t.k) + '</div>' +
                '<div class="bx-togrow__s">' + H.esc(t.s) + '</div></div>' +
                '<button class="bx-switch" role="switch" aria-checked="' + t.on + '" ' +
                'aria-label="' + H.esc(t.k) + '" data-tog="' + i + '"></button></div>';
            }).join(''), 'Save preferences') +

          card('security', 'Security',
            '<div class="bx-field"><label for="stC">Current password</label><input id="stC" type="password" value="demo-password" /></div>' +
            '<div class="bx-row2">' +
              '<div class="bx-field"><label for="stW">New password</label><input id="stW" type="password" placeholder="At least 8 characters" /></div>' +
              '<div class="bx-field"><label for="stR">Confirm</label><input id="stR" type="password" /></div>' +
            '</div>' +
            '<div class="bx-togrow" style="border-top:1px solid var(--bx-line-2);margin-top:6px">' +
              '<div><div class="bx-togrow__t">Two-factor authentication</div>' +
              '<div class="bx-togrow__s">Ask for a code from your phone at sign-in</div></div>' +
              '<button class="bx-switch" role="switch" aria-checked="false" aria-label="Two-factor authentication" data-tog="2fa"></button></div>',
            'Update password') +

          card('billing', 'Billing',
            '<div class="bx-dl">' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Plan</span><span class="bx-dl__v">' + H.esc(c.plan) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Next charge</span><span class="bx-dl__v">' + H.date(c.nextBilling) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Paid by</span><span class="bx-dl__v">' +
                H.esc(BIX.data.payTo.method) + ' · ' + H.esc(BIX.data.payTo.handle) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Billing email</span><span class="bx-dl__v">' + H.esc(c.email) + '</span></div>' +
            '</div>' +
            '<div style="display:flex;gap:9px;margin-top:16px;flex-wrap:wrap">' +
              '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="invoices">View invoices</button>' +
              '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="subscription">Change plan</button></div>',
            'Save billing') +
        '</div>' +
      '</div>';
    },

    mount: function (el) {
      el.querySelectorAll('#setRail .bx-set__link').forEach(function (b) {
        b.addEventListener('click', function () {
          el.querySelectorAll('#setRail .bx-set__link').forEach(function (o) { o.classList.toggle('is-on', o === b); });
          var t = el.querySelector('#' + b.getAttribute('data-sec'));
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      el.querySelectorAll('[data-tog]').forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-checked') !== 'true';
          b.setAttribute('aria-checked', String(on));
        });
      });
      el.querySelectorAll('[data-save]').forEach(function (b) {
        b.addEventListener('click', function () {
          var what = b.getAttribute('data-save');
          var d = BIX.data;
          if (what === 'Profile') {
            d.client.name = el.querySelector('#stN').value.trim() || d.client.name;
            d.client.email = el.querySelector('#stE').value.trim() || d.client.email;
            d.client.phone = el.querySelector('#stP').value.trim() || d.client.phone;
            d.client.firstName = d.client.name.split(' ')[0];
            d.client.initials = d.client.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
            document.getElementById('bxAvatar').textContent = d.client.initials;
          }
          if (what === 'Business') {
            d.client.business = el.querySelector('#stB').value.trim() || d.client.business;
            d.client.industry = el.querySelector('#stI').value.trim() || d.client.industry;
            d.client.address = el.querySelector('#stA').value.trim() || d.client.address;
            d.client.timezone = el.querySelector('#stZ').value.trim() || d.client.timezone;
            document.getElementById('bxSideBiz').textContent = d.client.business;
          }
          if (what === 'Photo') { BIX.toast('Photo picker would open here'); return; }
          var patch = what === 'Profile'
            ? { full_name: d.client.name, email: d.client.email, phone: d.client.phone }
            : what === 'Business'
              ? { business: d.client.business, industry: d.client.industry,
                  address: d.client.address, timezone: d.client.timezone }
              : null;
          if (!patch) { BIX.toast(what + ' saved'); return; }
          BIX.api.saveProfile(patch).then(function (res) {
            BIX.toast(res.error ? res.error.message : what + ' saved');
          });
        });
      });
    }
  };
})();
