/* ==========================================================================
   views-leads.js — pipeline board, table and lead detail
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;
  BIX.actions = BIX.actions || {};

  var mode = 'board';
  var filter = { source: 'All', temp: 'All' };
  var sort = { key: 'touched', dir: 'desc' };

  /* A five-column board is unusable on a phone. Forcing the table in JS rather
     than hiding the board in CSS keeps the toggle honest — otherwise "Board"
     stays selected and renders nothing. */
  function narrow() { return window.innerWidth <= 560; }
  function effMode() { return narrow() ? 'table' : mode; }

  function stageOf(id) {
    return BIX.data.stages.filter(function (s) { return s.id === id; })[0] || BIX.data.stages[0];
  }
  function visible() {
    return BIX.data.leads.filter(function (l) {
      return (filter.source === 'All' || l.source === filter.source) &&
             (filter.temp === 'All' || l.temp === filter.temp);
    });
  }

  /* --------------------------------- view ---------------------------------- */
  BIX.views.leads = {
    wide: true,
    render: function () {
      var d = BIX.data, t = d.totals;
      var sources = ['All'].concat(d.leads.map(function (l) { return l.source; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      var rows = visible();

      var head =
        '<div class="bx-stats">' +
          H.stat({ k: 'Open leads', v: t.openLeads, icon: 'target', tone: 'blue' }) +
          H.stat({ k: 'Pipeline value', v: BIX.money0(t.pipeline), icon: 'chart', tone: 'purple' }) +
          H.stat({ k: 'Won this month', v: t.wonThisMonth, icon: 'check', tone: 'green', note: BIX.money0(t.wonValue) + ' closed' }) +
          H.stat({ k: 'Avg deal size', v: BIX.money0(t.avgDeal), icon: 'money', tone: 'amber' }) +
        '</div>' +

        '<div class="bx-sec"><div class="bx-sec__h">' +
          (narrow() ? '<span></span>' :
          '<div class="bx-seg" role="tablist" aria-label="Pipeline layout">' +
            '<button class="bx-seg__b' + (mode === 'board' ? ' is-on' : '') + '" data-lm="board" role="tab" aria-selected="' + (mode === 'board') + '">' + I('grid') + ' Board</button>' +
            '<button class="bx-seg__b' + (mode === 'table' ? ' is-on' : '') + '" data-lm="table" role="tab" aria-selected="' + (mode === 'table') + '">' + I('list') + ' Table</button>' +
          '</div>') +
          '<button class="bx-btn bx-btn--primary bx-btn--sm" data-act="lead">' + I('plus') + ' Add lead</button>' +
        '</div>' +

        '<div class="bx-chips bx-chips--row">' +
          sources.map(function (s) {
            return '<button class="bx-chip' + (s === filter.source ? ' is-on' : '') + '" data-src="' + H.esc(s) + '">' + H.esc(s) + '</button>';
          }).join('') +
          '<span class="bx-chips__sep"></span>' +
          ['All', 'hot', 'warm', 'cold'].map(function (s) {
            return '<button class="bx-chip' + (s === filter.temp ? ' is-on' : '') + '" data-tmp="' + H.esc(s) + '">' + H.esc(s) + '</button>';
          }).join('') +
        '</div>';

      if (!rows.length) {
        return head + H.empty('target', 'No leads match', 'Clear a filter, or add the next enquiry.',
          '<button class="bx-btn bx-btn--primary" data-act="lead">Add lead</button>') + '</div>';
      }

      if (effMode() === 'table') return head + table(rows) + '</div>';

      return head +
        '<p class="bx-hint bx-mono">Drag a card between columns, or focus one and use ← →</p>' +
        '<div class="bx-board bx-board--lead" id="lbBoard">' + d.stages.map(function (s) {
          var items = rows.filter(function (l) { return l.stage === s.id; });
          var val = items.reduce(function (a, l) { return a + l.value; }, 0);
          return '<div class="bx-col" data-stage="' + H.esc(s.id) + '" style="--stage:' + s.color + '">' +
            '<div class="bx-col__h bx-mono"><span>' + H.esc(s.name) + '</span>' +
              '<span>' + items.length + ' · ' + BIX.money0(val) + '</span></div>' +
            '<div class="bx-col__b">' + (items.length ? items.map(card).join('')
              : '<div class="bx-col__none bx-mono">Empty</div>') + '</div></div>';
        }).join('') + '</div>' +
        '<div class="bx-sr" role="status" aria-live="polite" id="lbSay"></div>' +
        '</div>';
    },

    mount: function (el) {
      el.querySelectorAll('[data-lm]').forEach(function (b) {
        b.addEventListener('click', function () { mode = b.getAttribute('data-lm'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-src]').forEach(function (b) {
        b.addEventListener('click', function () { filter.source = b.getAttribute('data-src'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-tmp]').forEach(function (b) {
        b.addEventListener('click', function () { filter.temp = b.getAttribute('data-tmp'); BIX.app.rerender(); });
      });
      el.querySelectorAll('[data-act="lead"]').forEach(function (b) {
        b.addEventListener('click', function () { BIX.actions.lead(); });
      });
      el.querySelectorAll('[data-sort]').forEach(function (th) {
        th.addEventListener('click', function () {
          var k = th.getAttribute('data-sort');
          sort = { key: k, dir: sort.key === k && sort.dir === 'asc' ? 'desc' : 'asc' };
          BIX.app.rerender();
        });
      });
      el.querySelectorAll('[data-lead]').forEach(function (n) {
        n.addEventListener('click', function (e) {
          if (n.dataset.dragged === '1') { n.dataset.dragged = ''; return; }
          if (e.target.closest('button')) return;
          detail(n.getAttribute('data-lead'));
        });
        n.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); detail(n.getAttribute('data-lead')); return; }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            nudge(n.getAttribute('data-lead'), e.key === 'ArrowRight' ? 1 : -1);
          }
        });
      });
      if (effMode() === 'board') wireDrag(el);
    }
  };

  /* Re-render only when the viewport crosses the board/table threshold, so a
     phone rotating into landscape gets the right layout without thrashing. */
  var wasNarrow = narrow();
  window.addEventListener('resize', function () {
    var now = narrow();
    if (now === wasNarrow) return;
    wasNarrow = now;
    if (BIX.app.current() === 'leads' || BIX.app.current() === 'projects') BIX.app.rerender();
  });

  /* --------------------------------- cards --------------------------------- */
  function card(l) {
    var owner = H.member(l.owner);
    return '<article class="bx-lcard" data-lead="' + H.esc(l.id) + '" tabindex="0" ' +
      'role="button" aria-label="' + H.esc(l.business + ', ' + stageOf(l.stage).name + ' stage') + '">' +
      '<div class="bx-lcard__h"><span class="bx-lcard__n">' + H.esc(l.business) + '</span>' +
        '<span class="bx-lcard__v bx-mono">' + BIX.money0(l.value) + '</span></div>' +
      '<div class="bx-lcard__s">' + H.esc(l.contact) + ' · ' + H.esc(l.industry) + '</div>' +
      '<div class="bx-lcard__f">' + H.temp(l.temp) +
        '<span class="bx-lcard__r">' +
          '<span class="bx-avatar bx-avatar--sm" title="' + H.esc(owner.name) + '">' + H.esc(owner.initials) + '</span>' +
          '<span class="bx-mono">' + H.ago(l.touched) + '</span></span>' +
      '</div></article>';
  }

  function table(rows) {
    var cols = [
      ['business', 'Business', ''], ['contact', 'Contact', 'c-con'],
      ['industry', 'Industry', 'c-ind'], ['source', 'Source', 'c-src'],
      ['value', 'Value', 'num'], ['stage', 'Stage', ''],
      ['temp', 'Temp', 'c-st'], ['owner', 'Owner', 'c-own'], ['touched', 'Last touch', 'c-tou']
    ];
    var sorted = rows.slice().sort(function (a, b) {
      var x = a[sort.key], y = b[sort.key];
      if (typeof x === 'number') return sort.dir === 'asc' ? x - y : y - x;
      x = String(x); y = String(y);
      return sort.dir === 'asc' ? (x < y ? -1 : 1) : (x > y ? -1 : 1);
    });
    return '<div class="bx-table__wrap"><table class="bx-table">' +
      '<thead><tr>' + cols.map(function (c) {
        var on = sort.key === c[0];
        return '<th scope="col" class="' + c[2] + '" data-sort="' + c[0] + '" tabindex="0" ' +
          'aria-sort="' + (on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
          H.esc(c[1]) + '<span class="bx-caret' + (on ? ' is-on is-' + sort.dir : '') + '" aria-hidden="true"></span></th>';
      }).join('') + '</tr></thead><tbody>' +
      sorted.map(function (l) {
        var o = H.member(l.owner);
        return '<tr data-lead="' + H.esc(l.id) + '" tabindex="0">' +
          '<td><span class="bx-table__name">' + H.esc(l.business) + '</span></td>' +
          '<td class="c-con">' + H.esc(l.contact) + '</td>' +
          '<td class="c-ind">' + H.esc(l.industry) + '</td>' +
          '<td class="c-src">' + H.esc(l.source) + '</td>' +
          '<td class="num bx-mono">' + BIX.money0(l.value) + '</td>' +
          '<td>' + H.pill(stageOf(l.stage).name) + '</td>' +
          '<td class="c-st">' + H.temp(l.temp) + '</td>' +
          '<td class="c-own"><span class="bx-avatar bx-avatar--sm" title="' + H.esc(o.name) + '">' + H.esc(o.initials) + '</span></td>' +
          '<td class="c-tou bx-mono">' + H.ago(l.touched) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ------------------------------ stage moves ------------------------------ */
  function move(id, stageId, quiet) {
    var l = BIX.data.leads.filter(function (x) { return x.id === id; })[0];
    if (!l || l.stage === stageId) return null;
    l.stage = stageId;
    l.touched = BIX.data.today;
    l.log.unshift({ at: BIX.data.today, what: 'Moved to ' + stageOf(stageId).name });
    BIX.data.activity.unshift({
      at: BIX.data.today + 'T09:00:00', who: BIX.data.agency.founder,
      what: 'moved <b>' + H.esc(l.business) + '</b> to ' + H.esc(stageOf(stageId).name)
    });
    BIX.recompute();
    if (!quiet) BIX.toast(l.business + ' → ' + stageOf(stageId).name);
    return l;
  }

  /* Keyboard equivalent of the drag. Announced through the live region so it
     is usable without seeing the board move. */
  function nudge(id, dir) {
    var l = BIX.data.leads.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var order = BIX.data.stages.map(function (s) { return s.id; });
    var next = order[order.indexOf(l.stage) + dir];
    if (!next) return;
    move(id, next, true);
    BIX.app.rerender();
    /* Announce after the re-render, not before: rerender replaces the live
       region, so a message written first is thrown away unspoken. */
    var say = document.getElementById('lbSay');
    if (say) say.textContent = l.business + ' moved to ' + stageOf(next).name;
    var re = document.querySelector('[data-lead="' + id + '"]');
    if (re) re.focus();
    BIX.app.refreshChrome();
  }

  /* Pointer-based drag. HTML5 DnD gives no control over the drop indicator and
     does not fire at all on touch. */
  function wireDrag(el) {
    var board = el.querySelector('#lbBoard');
    if (!board) return;
    var ghost = null, src = null, id = null, from = null, startX = 0, startY = 0, live = false;

    function columnAt(x, y) {
      var hit = null;
      board.querySelectorAll('.bx-col').forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = c;
      });
      return hit;
    }
    function clearMarks() {
      board.querySelectorAll('.bx-col').forEach(function (c) { c.classList.remove('is-target'); });
    }
    function end() {
      if (ghost) { ghost.remove(); ghost = null; }
      if (src) src.classList.remove('is-ghosted');
      board.classList.remove('is-dragging');
      clearMarks();
      live = false; src = null; id = null; from = null;
    }

    board.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.bx-lcard');
      if (!c || e.button !== 0) return;
      src = c; id = c.getAttribute('data-lead');
      from = c.closest('.bx-col').getAttribute('data-stage');
      startX = e.clientX; startY = e.clientY;
      c.setPointerCapture(e.pointerId);
    });

    board.addEventListener('pointermove', function (e) {
      if (!src) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!live && Math.abs(dx) + Math.abs(dy) < 6) return;
      if (!live) {
        live = true;
        board.classList.add('is-dragging');
        var r = src.getBoundingClientRect();
        ghost = src.cloneNode(true);
        ghost.className = 'bx-lcard bx-lcard--ghost';
        ghost.style.width = r.width + 'px';
        ghost.style.left = r.left + 'px';
        ghost.style.top = r.top + 'px';
        document.body.appendChild(ghost);
        src.classList.add('is-ghosted');
      }
      ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      clearMarks();
      var col = columnAt(e.clientX, e.clientY);
      if (col && col.getAttribute('data-stage') !== from) col.classList.add('is-target');
    });

    board.addEventListener('pointerup', function (e) {
      if (!src) return;
      var wasLive = live;
      var col = wasLive ? columnAt(e.clientX, e.clientY) : null;
      var target = col && col.getAttribute('data-stage');
      var dropId = id;
      if (wasLive) src.dataset.dragged = '1';
      end();
      if (target && target !== from) {
        move(dropId, target);
        BIX.app.rerender();
        BIX.app.refreshChrome();
      }
    });
    board.addEventListener('pointercancel', end);
  }

  /* ------------------------------ lead detail ------------------------------ */
  function detail(id) {
    var l = BIX.data.leads.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    var owner = H.member(l.owner);

    BIX.drawer({
      eyebrow: l.industry + ' · via ' + l.source,
      title: l.business,
      body:
        '<div class="bx-dhero">' +
          '<div><div class="bx-dhero__k bx-mono">Value</div><div class="bx-dhero__v">' + BIX.money0(l.value) + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Stage</div><div class="bx-dhero__v is-plan">' + H.esc(stageOf(l.stage).name) + '</div></div>' +
          '<div><div class="bx-dhero__k bx-mono">Temp</div><div class="bx-dhero__v">' + H.temp(l.temp) + '</div></div>' +
        '</div>' +

        '<section class="bx-dsec"><h4>Move stage</h4>' +
          '<div class="bx-seg bx-seg--full" role="group" aria-label="Lead stage">' +
            BIX.data.stages.map(function (s) {
              return '<button class="bx-seg__b' + (s.id === l.stage ? ' is-on' : '') + '" data-stg="' + H.esc(s.id) + '">' + H.esc(s.name) + '</button>';
            }).join('') + '</div></section>' +

        '<section class="bx-dsec"><h4>Contact</h4>' +
          BIX.contactRow('mail', 'Email', l.email) +
          BIX.contactRow('phone', 'Phone', l.phone) +
          '<div class="bx-drow"><span class="bx-drow__k bx-mono">Owner</span>' +
            '<span class="bx-drow__v">' + H.esc(owner.name) + '</span></div>' +
        '</section>' +

        '<section class="bx-dsec"><h4>Notes</h4>' +
          '<div class="bx-notes2" id="ldNotes">' + (l.notes.length ? l.notes.map(noteHtml).join('')
            : '<p class="bx-faint">No notes yet.</p>') + '</div>' +
          '<div class="bx-field"><label for="ldNote" class="bx-sr">Add a note</label>' +
            '<textarea id="ldNote" rows="3" placeholder="What happened on this one?"></textarea></div>' +
          '<button class="bx-btn bx-btn--ghost bx-btn--sm" id="ldAdd">' + I('plus') + ' Add note</button>' +
        '</section>' +

        '<section class="bx-dsec"><h4>Activity</h4><ul class="bx-feed">' +
          l.log.map(function (e) {
            return '<li><div class="bx-feed__t">' + H.esc(e.what) + '</div>' +
              '<div class="bx-feed__w">' + H.date(e.at, 'short') + '</div></li>';
          }).join('') + '</ul></section>',

      foot:
        (BIX.isHidden('messages') ? '' : '<button class="bx-btn bx-btn--ghost" id="ldMsg">Send message</button>') +
        '<button class="bx-btn bx-btn--primary" id="ldWin">Convert to client</button>',

      mount: function (w) {
        BIX.wireCopy(w);

        w.querySelectorAll('[data-stg]').forEach(function (b) {
          b.addEventListener('click', function () {
            move(l.id, b.getAttribute('data-stg'));
            BIX.closeDrawer();
            BIX.app.rerender();
            BIX.app.refreshChrome();
          });
        });

        w.querySelector('#ldAdd').addEventListener('click', function () {
          var ta = w.querySelector('#ldNote');
          var body = ta.value.trim();
          if (!body) { BIX.toast('Write something first'); return; }
          l.notes.unshift({ at: BIX.data.today, by: BIX.data.agency.founder, body: body });
          l.touched = BIX.data.today;
          ta.value = '';
          var host = w.querySelector('#ldNotes');
          host.innerHTML = l.notes.map(noteHtml).join('');
          BIX.toast('Note added');
        });

        var msg = w.querySelector('#ldMsg');
        if (msg) msg.addEventListener('click', function () { BIX.composer({ to: l }); });

        w.querySelector('#ldWin').addEventListener('click', function () { convert(l); });
      }
    });
  }

  function noteHtml(n) {
    return '<div class="bx-note2"><div class="bx-note2__h bx-mono">' + H.esc(n.by) + ' · ' + H.date(n.at, 'short') + '</div>' +
      '<div class="bx-note2__b">' + H.esc(n.body) + '</div></div>';
  }

  function convert(l) {
    if (BIX.data.clients.some(function (c) { return c.business === l.business; })) {
      BIX.toast(l.business + ' is already a client');
      return;
    }
    BIX.modal({
      title: 'Convert to client',
      body: '<p class="bx-hero__s">' + H.esc(l.business) + ' moves to Won and opens as a client account. ' +
        'Pick the plan they signed.</p>' +
        '<div class="bx-field"><label for="cvP">Plan</label><select id="cvP">' +
          '<option>Essential</option><option selected>Growth Care</option><option>Scale</option></select></div>' +
        '<div class="bx-field"><label for="cvM">Monthly retainer (USD)</label><input id="cvM" type="number" value="340" /></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="cvGo">Convert</button>',
      mount: function (w) {
        w.querySelector('#cvGo').addEventListener('click', function () {
          l.stage = 'won';
          l.touched = BIX.data.today;
          BIX.data.clients.unshift({
            id: 'c-' + l.id, business: l.business, industry: l.industry, contact: l.contact,
            email: l.email, phone: l.phone, location: '—',
            plan: w.querySelector('#cvP').value, mrr: Number(w.querySelector('#cvM').value) || 0,
            status: 'Active', health: 100, since: BIX.data.today,
            project: 'Onboarding', percent: 0
          });
          BIX.data.activity.unshift({
            at: BIX.data.today + 'T09:00:00', who: BIX.data.agency.founder,
            what: 'converted <b>' + H.esc(l.business) + '</b> to a client'
          });
          BIX.recompute();
          BIX.closeModal(); BIX.closeDrawer();
          BIX.app.go('clients');
          BIX.app.refreshChrome();
          BIX.toast(l.business + ' is now a client');
        });
      }
    });
  }

  /* -------------------------------- add lead ------------------------------- */
  BIX.actions.lead = function () {
    var d = BIX.data;
    BIX.modal({
      title: 'Add lead',
      body:
        '<div class="bx-field"><label for="alB">Business</label><input id="alB" placeholder="Business name" /></div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="alC">Contact</label><input id="alC" placeholder="Full name" /></div>' +
          '<div class="bx-field"><label for="alE">Email</label><input id="alE" type="email" placeholder="name@business.com" /></div>' +
        '</div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="alI">Industry</label><input id="alI" placeholder="e.g. Gym" /></div>' +
          '<div class="bx-field"><label for="alS">Source</label><select id="alS">' +
            '<option>Referral</option><option>Instagram</option><option>Google</option><option>Website</option></select></div>' +
        '</div>' +
        '<div class="bx-row2">' +
          '<div class="bx-field"><label for="alV">Deal value (USD)</label><input id="alV" type="number" value="5000" /></div>' +
          '<div class="bx-field"><label for="alT">Temperature</label><select id="alT">' +
            '<option value="hot">hot</option><option value="warm" selected>warm</option><option value="cold">cold</option></select></div>' +
        '</div>' +
        '<div class="bx-field"><label for="alO">Owner</label><select id="alO">' +
          d.team.map(function (m) { return '<option value="' + H.esc(m.id) + '">' + H.esc(m.name) + '</option>'; }).join('') +
        '</select></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="alSave">Add lead</button>',
      mount: function (w) {
        w.querySelector('#alSave').addEventListener('click', function () {
          var biz = w.querySelector('#alB').value.trim();
          if (!biz) { BIX.toast('Give the lead a business name'); return; }
          var src = w.querySelector('#alS').value;
          d.leads.unshift({
            id: 'l-' + Date.now(), business: biz,
            contact: w.querySelector('#alC').value.trim() || '—',
            email: w.querySelector('#alE').value.trim() || '—', phone: '—',
            industry: w.querySelector('#alI').value.trim() || 'General',
            source: src, value: Number(w.querySelector('#alV').value) || 0,
            stage: 'new', temp: w.querySelector('#alT').value,
            owner: w.querySelector('#alO').value, touched: d.today,
            notes: [], log: [{ at: d.today, what: 'Lead created from ' + src }]
          });
          d.activity.unshift({ at: d.today + 'T09:00:00', who: d.agency.founder, what: 'added lead <b>' + H.esc(biz) + '</b>' });
          BIX.recompute();
          BIX.closeModal();
          BIX.app.go('leads');
          BIX.app.refreshChrome();
          BIX.toast(biz + ' added to New');
        });
      }
    });
  };
})();
