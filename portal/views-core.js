/* ==========================================================================
   Views: dashboard, project, requests
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;

  function ring(pct, caption) {
    var r = 50, c = 2 * Math.PI * r;
    return '<div class="bx-ring">' +
      '<svg width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">' +
        '<defs><linearGradient id="bxRingG" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#442061"/><stop offset="100%" stop-color="#2E89E6"/>' +
        '</linearGradient></defs>' +
        '<circle cx="59" cy="59" r="' + r + '" fill="none" stroke="rgba(20,16,31,.09)" stroke-width="9"/>' +
        '<circle class="bx-ring__c" cx="59" cy="59" r="' + r + '" fill="none" stroke="url(#bxRingG)" ' +
          'stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c + '" ' +
          'stroke-dashoffset="' + c + '" data-off="' + (c - c * pct / 100) + '"/>' +
      '</svg>' +
      '<div class="bx-ring__mid"><div class="bx-ring__v">' + pct + '%</div>' +
      '<div class="bx-ring__k">' + H.esc(caption) + '</div></div></div>';
  }
  function animateRing(el) {
    var c = el.querySelector('.bx-ring__c');
    if (!c) return;
    /* Flush layout so the transition has a start frame, then set the end value.
       A rAF here stalls the ring whenever the tab throttles frames. */
    void c.getBoundingClientRect();
    c.style.strokeDashoffset = c.getAttribute('data-off');
  }
  BIX.ring = ring;
  BIX.animateRing = animateRing;

  /* ============================== DASHBOARD ============================== */
  BIX.views.dashboard = {
    wide: true,
    render: function () {
      var d = BIX.data, p = d.project;

      /* Quick actions filtered by feature flags — the grid sizes itself to
         whatever survives, so a hidden feature leaves no empty column. */
      var actions = [
        { id: 'requests', icon: 'plus',     t: 'New request',    s: 'Ask for a change or fix' },
        { id: 'booking',  icon: 'calendar', t: 'Book a meeting', s: 'Grab time with your lead' },
        { id: 'invoices', icon: 'card',     t: 'View invoices',  s: 'Balance and payment history' },
        { id: 'files',    icon: 'upload',   t: 'Upload files',   s: 'Send us photos or copy' },
        { id: 'messages', icon: 'inbox',    t: 'Message the team', s: 'Ask a quick question' },
        { id: 'ai',       icon: 'zap',      t: 'Ask Bix',        s: 'Answers from your account' }
      ].filter(function (a) { return !BIX.isHidden(a.id); });

      var openReqs = d.requests.filter(function (r) { return r.status === 'Open' || r.status === 'In progress'; });
      var nextMeeting = d.meetings.filter(function (m) { return m.upcoming; })[0];
      var dueInv = d.invoices.filter(function (i) { return i.status !== 'Paid'; });

      var doneCount = d.phases.filter(function (f) { return f.state === 'done'; }).length;

      return '' +
      '<div class="bx-greet">' +
        '<h1>Welcome back, ' + H.esc(d.client.firstName) + '</h1>' +
        '<span class="bx-mono">' + H.date(d.today, 'long') + '</span>' +
      '</div>' +

      /* status hero */
      '<div class="bx-card bx-hero">' +
        ring(p.progress, 'Complete') +
        '<div class="bx-hero__body">' +
          '<div class="bx-hero__t">' + H.esc(p.name) + '</div>' +
          '<div class="bx-hero__s">' + H.esc(p.phase) + ' · Next up: ' + H.esc(p.nextMilestone) + '</div>' +
          '<div class="bx-chips">' + d.phases.slice(0, 4).map(function (f) {
            return '<span class="bx-chip ' + (f.state === 'done' ? 'is-done' : f.state === 'now' ? 'is-now' : '') + '">' +
              (f.state === 'done' ? '✓ ' : '') + H.esc(f.name) + '</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<div><button class="bx-btn bx-btn--ghost" data-go="project">View project</button></div>' +
      '</div>' +

      /* quick actions */
      '<div class="bx-sec"><div class="bx-sec__h"><h2>Quick actions</h2></div>' +
        '<div class="bx-qas" style="' + H.autoCols(actions.length, 4) + '">' +
          actions.map(function (a) {
            return '<button class="bx-qa" data-go="' + a.id + '">' +
              '<span class="bx-qa__chip">' + I(a.icon) + '</span>' +
              '<span><span class="bx-qa__t">' + H.esc(a.t) + '</span>' +
              '<span class="bx-qa__s">' + H.esc(a.s) + '</span></span></button>';
          }).join('') +
        '</div>' +
      '</div>' +

      /* split */
      '<div class="bx-sec bx-split">' +
        '<div class="bx-stack">' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Recent activity</h3></div>' +
            '<div class="bx-card__body"><ul class="bx-feed">' +
              d.activity.slice(0, 6).map(function (a) {
                return '<li><div class="bx-feed__t"><b>' + H.esc(a.who) + '</b> ' + a.what + '</div>' +
                  '<div class="bx-feed__w">' + H.esc(a.w) + '</div></li>';
              }).join('') +
            '</ul></div>' +
            '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="project">Project detail</button></div>' +
          '</div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Open requests</h3>' +
            '<div class="bx-card__head-r"><span class="bx-pill bx-pill--amber">' + openReqs.length + ' open</span></div></div>' +
            '<div class="bx-card__body">' +
              (openReqs.length ? openReqs.slice(0, 4).map(function (r) {
                return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(r.title) + '</div>' +
                  '<div class="bx-mini__s">' + H.esc(r.id) + ' · ' + H.date(r.date) + '</div></div>' +
                  H.pill(r.status) + '</div>';
              }).join('') : H.empty('check', 'Nothing open', 'Every request has been dealt with.')) +
            '</div>' +
            '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="requests">All requests</button></div>' +
          '</div>' +

        '</div>' +

        '<div class="bx-stack">' +

          /* next meeting — falls back to a live CTA when booking is hidden */
          '<div class="bx-card"><div class="bx-card__head"><h3>Next meeting</h3></div>' +
            '<div class="bx-card__body">' +
              (nextMeeting
                ? '<div style="display:flex;gap:14px;align-items:center">' +
                    '<div class="bx-datebox"><div class="bx-datebox__d">' + H.date(nextMeeting.when, 'day') + '</div>' +
                    '<div class="bx-datebox__m">' + H.date(nextMeeting.when, 'mon') + '</div></div>' +
                    '<div><div class="bx-mini__t">' + H.esc(nextMeeting.title) + '</div>' +
                    '<div class="bx-mini__s">' + H.esc(nextMeeting.time) + ' · ' + H.esc(nextMeeting.dur) + '</div></div>' +
                  '</div>'
                : H.empty('calendar', 'No meetings booked', 'Nothing on the calendar right now.')) +
            '</div>' +
            '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="meetings">All meetings</button></div>' +
          '</div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Outstanding</h3></div>' +
            '<div class="bx-card__body">' +
              (d.outstanding
                ? '<div class="bx-big">' + H.money(d.outstanding) + '</div>' +
                  '<div class="bx-mini__s" style="margin-top:6px">across ' + dueInv.length + ' invoice' + (dueInv.length === 1 ? '' : 's') + '</div>'
                : H.empty('check', 'All settled', 'No outstanding balance.')) +
            '</div>' +
            '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="invoices">View invoices</button></div>' +
          '</div>' +

        '</div>' +
      '</div>';
    },
    mount: function (el) { animateRing(el); }
  };

  /* =============================== PROJECT =============================== */
  BIX.views.project = {
    render: function () {
      var d = BIX.data, p = d.project;
      var typeIcon = { system: 'zap', page: 'globe', doc: 'doc', video: 'video' };

      return '' +
      '<div class="bx-card">' +
        '<div style="padding:22px">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
            '<div><div class="bx-hero__t">' + H.esc(p.name) + '</div>' +
            '<a class="bx-mono" href="' + H.esc(p.url) + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:7px">' +
              H.esc(p.url.replace('https://', '')) + ' ↗</a></div>' +
            H.pill(p.status) +
          '</div>' +
          '<p class="bx-hero__s" style="margin-top:12px;max-width:62ch">' + H.esc(p.summary) + '</p>' +
        '</div>' +
        '<div class="bx-metas">' +
          '<div class="bx-meta"><div class="bx-mono bx-meta__k">Launched</div><div class="bx-meta__v">' + H.date(p.launched) + '</div></div>' +
          '<div class="bx-meta"><div class="bx-mono bx-meta__k">Phase</div><div class="bx-meta__v">' + H.esc(p.phase) + '</div></div>' +
          '<div class="bx-meta"><div class="bx-mono bx-meta__k">Stack</div><div class="bx-meta__v">' + H.esc(p.stack) + '</div></div>' +
          '<div class="bx-meta"><div class="bx-mono bx-meta__k">Last updated</div><div class="bx-meta__v">' + H.date(p.lastUpdated) + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="bx-sec bx-split">' +
        '<div class="bx-stack">' +
          '<div class="bx-card"><div class="bx-card__head"><h3>Phases</h3>' +
            '<div class="bx-card__head-r"><span class="bx-mono bx-faint">' + p.progress + '% complete</span></div></div>' +
            '<div class="bx-card__body"><ul class="bx-checks">' +
              d.phases.map(function (f) {
                var cls = f.state === 'done' ? 'is-done' : f.state === 'now' ? 'is-now' : '';
                var ico = f.state === 'done' ? 'check' : f.state === 'now' ? 'spinner' : 'clock';
                return '<li class="' + cls + '"><span class="bx-checks__ico">' + I(ico) + '</span>' +
                  '<span><span class="bx-checks__t">' + H.esc(f.name) + '</span>' +
                  '<span class="bx-checks__s">' + H.esc(f.note) + '</span></span></li>';
              }).join('') +
            '</ul></div></div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Deliverables</h3></div>' +
            '<div class="bx-card__body">' + d.deliverables.map(function (v) {
              return '<div class="bx-mini"><div style="display:flex;gap:11px;align-items:center">' +
                '<span class="bx-qa__chip" style="width:30px;height:30px">' + I(typeIcon[v.type] || 'file') + '</span>' +
                '<div><div class="bx-mini__t">' + H.esc(v.name) + '</div>' +
                '<div class="bx-mini__s">' + H.date(v.date) + '</div></div></div></div>';
            }).join('') + '</div></div>' +
        '</div>' +

        '<div class="bx-stack">' +
          '<div class="bx-note"><h3>What\'s next</h3>' +
            '<p>' + H.esc(p.nextMilestone) + '. We\'ll walk you through the flow before anything ships, ' +
            'so nothing changes for your clients without you seeing it first.</p></div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Your team</h3></div>' +
            '<div class="bx-card__body">' +
              (d.team.length
                ? '<div class="bx-avatars">' + d.team.map(function (t) {
                    return '<span class="bx-person__a" title="' + H.esc(t.name) + '">' + H.esc(t.initials) + '</span>';
                  }).join('') + '</div>'
                : '<div class="bx-avatars"><span class="bx-person__a" title="Bix LLC">BX</span></div>') +
            '</div>' +
            '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="requests">Request a change</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  };

  /* =============================== REQUESTS ============================== */
  var reqFilter = 'All';

  BIX.views.requests = {
    render: function () {
      var d = BIX.data;
      var monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      var doneThisMonth = d.requests.filter(function (r) { return r.status === 'Completed' && r.date >= monthAgo; }).length;

      var rows = d.requests.filter(function (r) { return reqFilter === 'All' || r.status === reqFilter; });

      return '' +
      '<div class="bx-stats bx-stats--3">' +
        stat('purple', 'edit',  'Open',                d.countRequests('Open')) +
        stat('blue',   'spinner', 'In progress',       d.countRequests('In progress')) +
        stat('green',  'check', 'Completed this month', doneThisMonth) +
      '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h">' +
        '<div class="bx-seg" id="reqFilters">' +
          ['All', 'Open', 'In progress', 'Completed'].map(function (f) {
            return '<button class="bx-seg__b' + (f === reqFilter ? ' is-on' : '') + '" data-f="' + f + '">' + f + '</button>';
          }).join('') +
        '</div>' +
        '<button class="bx-btn bx-btn--primary" id="reqNew">' + I('plus') + 'New request</button>' +
      '</div>' +

      '<div class="bx-card"><div class="bx-table__wrap">' +
        (rows.length ?
        '<table class="bx-table"><thead><tr>' +
          '<th scope="col">ID</th><th scope="col">Title</th><th scope="col" class="bx-drop-col">Category</th>' +
          '<th scope="col" class="bx-drop-col">Priority</th><th scope="col">Status</th>' +
          '<th scope="col" class="bx-drop-col">Submitted</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr class="is-clickable" data-req="' + H.esc(r.id) + '">' +
              '<td class="bx-num bx-faint">' + H.esc(r.id) + '</td>' +
              '<td class="bx-table__name">' + H.esc(r.title) + '</td>' +
              '<td class="bx-drop-col">' + H.esc(r.category) + '</td>' +
              '<td class="bx-drop-col">' + H.priority(r.priority) + '</td>' +
              '<td>' + H.pill(r.status) + '</td>' +
              '<td class="bx-drop-col bx-num bx-faint">' + H.date(r.date) + '</td></tr>' +
            '<tr class="bx-detail" data-detail="' + H.esc(r.id) + '" hidden><td colspan="6"><div class="bx-detail__in">' +
              '<div class="bx-detail__d">' + H.esc(r.desc) + '</div>' +
              '<div style="display:flex;gap:8px;margin-top:14px">' +
                '<button class="bx-btn bx-btn--ghost bx-btn--sm" data-edit="' + H.esc(r.dbId) + '">Edit</button>' +
                '<button class="bx-btn bx-btn--danger bx-btn--sm" data-del="' + H.esc(r.dbId) + '">Delete</button>' +
              '</div>' +
              (r.comments.length ? '<div class="bx-thread">' + r.comments.map(function (c) {
                return '<div class="bx-cmt"><span class="bx-cmt__a">' + H.esc(c.who.split(' ').map(function (w) { return w[0]; }).join('')) + '</span>' +
                  '<div class="bx-cmt__b"><div class="bx-cmt__w">' + H.esc(c.who) + ' · ' + H.esc(c.w) + '</div>' +
                  '<div class="bx-cmt__t">' + H.esc(c.t) + '</div></div></div>';
              }).join('') + '</div>' : '<div class="bx-mini__s" style="margin-top:10px">No comments yet.</div>') +
            '</div></td></tr>';
          }).join('') +
        '</tbody></table>'
        : H.empty('edit', 'No requests here', 'Nothing matches this filter.',
            '<button class="bx-btn bx-btn--primary" id="reqNew2">New request</button>')) +
      '</div></div>';
    },

    mount: function (el) {
      el.querySelectorAll('#reqFilters .bx-seg__b').forEach(function (b) {
        b.addEventListener('click', function () { reqFilter = b.getAttribute('data-f'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-req]').forEach(function (row) {
        row.addEventListener('click', function () {
          var d = el.querySelector('[data-detail="' + row.getAttribute('data-req') + '"]');
          if (d) d.hidden = !d.hidden;
        });
      });
      el.querySelectorAll('[data-edit]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var r = BIX.data.requests.filter(function (x) { return x.dbId === b.getAttribute('data-edit'); })[0];
          if (r) openEdit(r);
        });
      });
      el.querySelectorAll('[data-del]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = b.getAttribute('data-del');
          var r = BIX.data.requests.filter(function (x) { return x.dbId === id; })[0];
          BIX.modal({
            title: 'Delete this request?',
            body: '<p class="bx-hero__s">“' + H.esc(r ? r.title : '') + '” will be removed for good. ' +
                  'This cannot be undone.</p>',
            foot: '<button class="bx-btn bx-btn--ghost" data-close>Keep it</button>' +
                  '<button class="bx-btn bx-btn--danger" id="rqKill">Delete request</button>',
            mount: function (w) {
              w.querySelector('#rqKill').addEventListener('click', function () {
                BIX.api.deleteRequest(id).then(function (res) {
                  if (res.error) { BIX.toast(res.error.message); return; }
                  return BIX.api.loadFor(BIX.api.viewingId).then(function () {
                    BIX.closeModal(); BIX.app.rerender(); BIX.toast('Request deleted');
                  });
                });
              });
            }
          });
        });
      });
      ['reqNew', 'reqNew2'].forEach(function (id) {
        var b = el.querySelector('#' + id);
        if (b) b.addEventListener('click', openNew);
      });
    }
  };

  function stat(tone, icon, label, value, delta) {
    return '<div class="bx-stat">' +
      '<div class="bx-stat__chip bx-stat__chip--' + tone + '">' + I(icon) + '</div>' +
      '<div class="bx-mono bx-stat__k">' + H.esc(label) + '</div>' +
      '<div class="bx-stat__v">' + H.esc(value) + '</div>' +
      (delta || '') + '</div>';
  }
  BIX.stat = stat;

  function openEdit(r) {
    BIX.modal({
      title: 'Edit request',
      body:
        '<div class="bx-field"><label for="edT">Title</label>' +
          '<input id="edT" value="' + H.esc(r.title) + '" /></div>' +
        '<div class="bx-field"><label for="edC">Category</label>' +
          '<select id="edC">' + ['Feature','Content','Bug','Question'].map(function (c) {
            return '<option' + (c === r.category ? ' selected' : '') + '>' + c + '</option>';
          }).join('') + '</select></div>' +
        '<div class="bx-field"><label id="edPL">Priority</label>' +
          '<div class="bx-seg" id="edP" role="radiogroup" aria-labelledby="edPL">' +
            ['Low','Medium','High'].map(function (p) {
              return '<button type="button" class="bx-seg__b' + (p === r.priority ? ' is-on' : '') + '" ' +
                'role="radio" aria-checked="' + (p === r.priority) + '" data-p="' + p + '">' + p + '</button>';
            }).join('') + '</div></div>' +
        '<div class="bx-field"><label for="edD">Description</label>' +
          '<textarea id="edD">' + H.esc(r.desc) + '</textarea></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="edSave">Save changes</button>',
      mount: function (w) {
        var pri = r.priority;
        w.querySelectorAll('#edP .bx-seg__b').forEach(function (b) {
          b.addEventListener('click', function () {
            pri = b.getAttribute('data-p');
            w.querySelectorAll('#edP .bx-seg__b').forEach(function (o) {
              var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-checked', String(on));
            });
          });
        });
        w.querySelector('#edSave').addEventListener('click', function () {
          var t = w.querySelector('#edT').value.trim();
          if (!t) { w.querySelector('#edT').focus(); BIX.toast('Give the request a title'); return; }
          BIX.api.updateRequest(r.dbId, {
            title: t,
            category: w.querySelector('#edC').value,
            priority: pri,
            body: w.querySelector('#edD').value.trim()
          }).then(function (res) {
            if (res.error) { BIX.toast(res.error.message); return; }
            return BIX.api.loadFor(BIX.api.viewingId).then(function () {
              BIX.closeModal(); BIX.app.rerender(); BIX.toast('Request updated');
            });
          });
        });
      }
    });
  }

  function openNew() {
    BIX.modal({
      title: 'New request',
      body:
        '<div class="bx-field"><label for="rqT">Title</label>' +
          '<input id="rqT" placeholder="What would you like changed?" /></div>' +
        '<div class="bx-field"><label for="rqC">Category</label>' +
          '<select id="rqC"><option>Feature</option><option>Content</option><option>Bug</option><option>Question</option></select></div>' +
        '<div class="bx-field"><label id="rqPL">Priority</label>' +
          '<div class="bx-seg" id="rqP" role="radiogroup" aria-labelledby="rqPL">' +
            ['Low', 'Medium', 'High'].map(function (p, i) {
              return '<button type="button" class="bx-seg__b' + (i === 1 ? ' is-on' : '') + '" role="radio" ' +
                'aria-checked="' + (i === 1) + '" data-p="' + p + '">' + p + '</button>';
            }).join('') + '</div></div>' +
        '<div class="bx-field"><label for="rqD">Description</label>' +
          '<textarea id="rqD" placeholder="Give us the detail — what it should do, and why."></textarea></div>' +
        '<div class="bx-drop" id="rqDrop">' + I('upload') +
          '<div class="bx-drop__t">Drop an attachment</div>' +
          '<div class="bx-mono bx-drop__s">Optional · png, jpg, pdf</div></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="rqSave">Submit request</button>',
      mount: function (wrap) {
        var pri = 'Medium';
        wrap.querySelectorAll('#rqP .bx-seg__b').forEach(function (b) {
          b.addEventListener('click', function () {
            pri = b.getAttribute('data-p');
            wrap.querySelectorAll('#rqP .bx-seg__b').forEach(function (o) {
              var on = o === b;
              o.classList.toggle('is-on', on);
              o.setAttribute('aria-checked', String(on));
            });
          });
        });

        var drop = wrap.querySelector('#rqDrop');
        ['dragenter', 'dragover'].forEach(function (t) {
          drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
        });
        ['dragleave', 'drop'].forEach(function (t) {
          drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
        });
        drop.addEventListener('drop', function () { BIX.toast('Attachment added'); });

        wrap.querySelector('#rqSave').addEventListener('click', function () {
          var t = wrap.querySelector('#rqT').value.trim();
          if (!t) { wrap.querySelector('#rqT').focus(); BIX.toast('Give the request a title'); return; }
          var btn = wrap.querySelector('#rqSave');
          btn.disabled = true;
          BIX.api.addRequest({
            title: t,
            category: wrap.querySelector('#rqC').value,
            priority: pri,
            body: wrap.querySelector('#rqD').value.trim() || 'No further detail provided.'
          }).then(function (res) {
            if (res.error) { btn.disabled = false; BIX.toast(res.error.message); return; }
            return BIX.api.loadFor(BIX.api.viewingId).then(function () {
              BIX.closeModal();
              reqFilter = 'All';
              BIX.app.rerender();
              BIX.toast('Request submitted');
            });
          });
        });
      }
    });
  }
})();
