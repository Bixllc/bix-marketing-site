/* ==========================================================================
   BIX.app — nav model, router, shell render, shared UI helpers, icon set.
   ========================================================================== */
window.BIX = window.BIX || {};
BIX.views = BIX.views || {};

/* Features switched off for launch. Everything downstream — nav, quick
   actions, dashboard cards, FAQs, tutorials, secondary CTAs — filters through
   BIX.isHidden so a hidden feature leaves no dead button behind. */
BIX.hidden = ['messages', 'booking', 'ai', 'analytics'];
BIX.isHidden = id => BIX.hidden.indexOf(id) > -1;

(function () {
  'use strict';

  /* --------------------------------- icons -------------------------------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6.5 17.5 9.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M21 19H3"/>',
    life: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="M14.6 9.4 18 6M9.4 9.4 6 6M14.6 14.6 18 18M9.4 14.6 6 18"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
    download: '<path d="M12 4v12"/><path d="m7.5 11.5 4.5 4.5 4.5-4.5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m6 9.5 6 6 6-6"/>',
    arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9z"/><path d="M13.7 19.5a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    spinner: '<path d="M12 3a9 9 0 1 0 9 9"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>',
    logout: '<path d="M14 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 4 4v16a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 20v-1.5"/><path d="M9 12h11"/><path d="m16.5 8.5 3.5 3.5-3.5 3.5"/>',
    crown: '<path d="m3 8 4 3 5-6 5 6 4-3-2 11H5z"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h4"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 11 6-3.5v9L15 13z"/>',
    shield: '<path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    zap: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
    inbox: '<path d="M3.5 13h4l1.5 3h6l1.5-3h4"/><path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>',
    ticket: '<path d="M4 8.5V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v2a2.5 2.5 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-2a2.5 2.5 0 0 0 0-7z"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    building: '<path d="M4 20V6a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13 6v14"/><path d="M13 10h5.5A1.5 1.5 0 0 1 20 11.5V20"/><path d="M3 20h18"/><path d="M7 8.5h2M7 12h2M7 15.5h2M16 13.5h1M16 17h1"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.5-4 3.5 3 3-2.5 4 3.5"/>'
  };

  BIX.icon = function (name, cls) {
    var d = P[name] || P.file;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : '') + '>' + d + '</svg>';
  };

  /* ---------------------------------- nav --------------------------------- */
  BIX.nav = [
    { label: 'Overview', items: [
      { id: 'dashboard', name: 'Dashboard', icon: 'home',   sub: 'Your project at a glance' },
      { id: 'project',   name: 'My Project', icon: 'folder', sub: 'Scope, phases and deliverables' }
    ]},
    { label: 'Work', items: [
      { id: 'requests', name: 'Request Changes', icon: 'edit',     sub: 'Ask for updates and track them' },
      { id: 'messages', name: 'Messages',        icon: 'inbox',    sub: 'Talk to your team' },
      { id: 'files',    name: 'Files & Assets',  icon: 'file',     sub: 'Everything we have shared' },
      { id: 'meetings', name: 'Meetings',        icon: 'calendar', sub: 'Calls with your team' },
      { id: 'booking',  name: 'Book a Slot',     icon: 'clock',    sub: 'Grab time with us' }
    ]},
    { label: 'Business', items: [
      { id: 'invoices',     name: 'Invoices',     icon: 'card',  sub: 'Billing and payments' },
      { id: 'subscription', name: 'Subscription', icon: 'crown', sub: 'Your care plan' },
      { id: 'website',      name: 'Website',      icon: 'globe', sub: 'Your live site and hosting' }
    ]},
    { label: 'Growth', items: [
      { id: 'analytics', name: 'Analytics', icon: 'chart', sub: 'Traffic, leads and revenue' },
      { id: 'ai',        name: 'Ask Bix',   icon: 'zap',   sub: 'Your AI assistant' }
    ]},
    { label: 'Account', items: [
      { id: 'support',  name: 'Support',  icon: 'life', sub: 'Tickets, docs and tutorials' },
      { id: 'settings', name: 'Settings', icon: 'gear', sub: 'Profile and preferences' }
    ]}
  ];

  function visibleNav() {
    return BIX.nav.map(function (g) {
      return { label: g.label, items: g.items.filter(function (i) { return !BIX.isHidden(i.id); }) };
    }).filter(function (g) { return g.items.length; });
  }

  function findItem(id) {
    var hit = null;
    BIX.nav.forEach(function (g) {
      g.items.forEach(function (i) { if (i.id === id) hit = i; });
    });
    return hit;
  }

  /* -------------------------------- helpers ------------------------------- */
  var H = {
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    money: function (n, dp) {
      return '$' + Number(n).toLocaleString('en-US', {
        minimumFractionDigits: dp == null ? 0 : dp, maximumFractionDigits: dp == null ? 0 : dp
      });
    },
    date: function (isoStr, style) {
      var d = new Date(isoStr + 'T12:00:00');
      if (style === 'long') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (style === 'day') return String(d.getDate());
      if (style === 'mon') return d.toLocaleDateString('en-US', { month: 'short' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    /* Status → semantic colour. One table so no view invents its own mapping. */
    tone: function (status) {
      var s = String(status).toLowerCase();
      if (['completed', 'live', 'paid', 'valid', 'resolved'].indexOf(s) > -1) return 'green';
      if (['in progress', 'active', 'building'].indexOf(s) > -1) return 'blue';
      if (['pending', 'outstanding', 'review', 'open', 'scheduled'].indexOf(s) > -1) return 'amber';
      if (['blocked', 'overdue', 'failed', 'cancelled'].indexOf(s) > -1) return 'red';
      return 'neutral';
    },
    pill: function (status) {
      return '<span class="bx-pill bx-pill--' + H.tone(status) + '">' + H.esc(status) + '</span>';
    },
    priority: function (p) {
      var tone = p === 'High' ? 'red' : p === 'Medium' ? 'amber' : 'neutral';
      return '<span class="bx-pill bx-pill--' + tone + '">' + H.esc(p) + '</span>';
    },
    /* Grid whose column count equals the number of surviving items, so hiding
       a feature can never leave an orphaned column. */
    autoCols: function (n, max) {
      var c = Math.min(n, max || 4);
      /* A custom property, not grid-template-columns: an inline declaration
         would outrank the responsive rules and strand the grid at N columns
         on a phone. */
      return '--bx-cols: ' + Math.max(c, 1) + ';';
    },
    empty: function (icon, title, sub, cta) {
      return '<div class="bx-empty">' + BIX.icon(icon) +
        '<div class="bx-empty__t">' + H.esc(title) + '</div>' +
        '<div class="bx-empty__s">' + H.esc(sub) + '</div>' + (cta || '') + '</div>';
    }
  };
  BIX.h = H;

  /* --------------------------------- toast -------------------------------- */
  BIX.toast = function (msg) {
    var root = document.getElementById('bxToasts');
    var el = document.createElement('div');
    el.className = 'bx-toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  };

  /* --------------------------------- modal -------------------------------- */
  var modalPrev = null;

  BIX.modal = function (opts) {
    BIX.closeModal();
    modalPrev = document.activeElement;

    var root = document.getElementById('bxModalRoot');
    var wrap = document.createElement('div');
    wrap.className = 'bx-modal';
    wrap.innerHTML =
      '<div class="bx-modal__scrim" data-close></div>' +
      '<div class="bx-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="bxModalTitle">' +
        '<div class="bx-modal__head"><h3 id="bxModalTitle">' + H.esc(opts.title) + '</h3>' +
          '<button class="bx-modal__x" data-close aria-label="Close">' + BIX.icon('x') + '</button></div>' +
        '<div class="bx-modal__body">' + opts.body + '</div>' +
        (opts.foot ? '<div class="bx-modal__foot">' + opts.foot + '</div>' : '') +
      '</div>';
    root.appendChild(wrap);
    document.body.style.overflow = 'hidden';

    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) BIX.closeModal();
    });

    /* focus trap */
    var sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    wrap.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = wrap.querySelectorAll(sel);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    var field = wrap.querySelector('input,select,textarea');
    (field || wrap.querySelector('.bx-modal__x')).focus();

    if (opts.mount) opts.mount(wrap);
    return wrap;
  };

  BIX.closeModal = function () {
    var root = document.getElementById('bxModalRoot');
    if (!root.firstChild) return;
    root.innerHTML = '';
    document.body.style.overflow = '';
    if (modalPrev && modalPrev.focus) modalPrev.focus();
    modalPrev = null;
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('bxModalRoot').firstChild) { BIX.closeModal(); return; }
      closePop();
      closeDrawer();
    }
  });

  /* ---------------------------------- pop --------------------------------- */
  function closePop() {
    var pop = document.getElementById('bxPop');
    if (pop) { pop.hidden = true; document.getElementById('bxAvatar').setAttribute('aria-expanded', 'false'); }
  }

  /* -------------------------------- drawer -------------------------------- */
  function openDrawer() {
    document.getElementById('bxSide').classList.add('is-open');
    document.getElementById('bxScrim').hidden = false;
  }
  function closeDrawer() {
    document.getElementById('bxSide').classList.remove('is-open');
    document.getElementById('bxScrim').hidden = true;
  }

  /* --------------------------------- shell -------------------------------- */
  function renderShell() {
    var d = BIX.data;

    document.getElementById('bxSideBiz').textContent = d.client.business;
    document.getElementById('bxSidePlan').textContent = d.client.plan;
    document.getElementById('bxAvatar').textContent = d.client.initials;

    /* nav */
    document.getElementById('bxNav').innerHTML = visibleNav().map(function (g) {
      return '<div class="bx-nav__group">' +
        '<div class="bx-nav__label">' + H.esc(g.label) + '</div>' +
        g.items.map(function (i) {
          return '<button class="bx-nav__item" data-go="' + i.id + '" title="' + H.esc(i.name) + '">' +
            BIX.icon(i.icon) + '<span class="bx-nav__txt">' + H.esc(i.name) + '</span></button>';
        }).join('') + '</div>';
    }).join('');

    /* plan card */
    document.getElementById('bxPlanCard').innerHTML =
      '<div class="bx-mono bx-plancard__k">Current plan</div>' +
      '<div class="bx-plancard__v">' + H.esc(d.client.plan) + '</div>' +
      '<div class="bx-plancard__d">Renews ' + H.date(d.client.nextBilling) + '</div>' +
      '<button class="bx-btn bx-btn--ghost bx-btn--sm bx-btn--block" data-go="subscription">Manage</button>' +
      '<button class="bx-plancard__ico" data-go="subscription" aria-label="Manage subscription">' + BIX.icon('crown') + '</button>';

    /* icon buttons */
    document.getElementById('bxBurger').innerHTML = BIX.icon('menu');
    document.getElementById('bxSearchBtn').innerHTML = BIX.icon('search');
    var bell = document.getElementById('bxBell');
    bell.innerHTML = BIX.icon('bell');
    if (d.notifications.length) bell.classList.add('has-dot');

    /* popover */
    document.getElementById('bxPop').innerHTML =
      '<button class="bx-pop__item" data-go="settings" role="menuitem">' + BIX.icon('gear') + 'Settings</button>' +
      '<button class="bx-pop__item" data-go="support" role="menuitem">' + BIX.icon('life') + 'Support</button>' +
      '<div class="bx-pop__sep"></div>' +
      '<button class="bx-pop__item" id="bxLogout" role="menuitem">' + BIX.icon('logout') + 'Log out</button>';
  }

  /* ------------------------- admin: client switcher ----------------------- */
  function renderSwitcher() {
    var el = document.getElementById('bxSwitcher');
    if (!BIX.api.isAdmin() || !BIX.api.clients.length) { el.hidden = true; return; }

    el.hidden = false;
    el.innerHTML =
      '<label class="bx-sr" for="bxClientSel">Viewing client</label>' +
      '<select class="bx-switcher__sel" id="bxClientSel">' +
        BIX.api.clients.map(function (c) {
          return '<option value="' + H.esc(c.id) + '"' + (c.id === BIX.api.viewingId ? ' selected' : '') + '>' +
            H.esc(c.business || c.full_name || 'Client') + '</option>';
        }).join('') +
      '</select>';

    el.querySelector('#bxClientSel').addEventListener('change', function (e) {
      var id = e.target.value;
      document.getElementById('bxView').innerHTML =
        '<div class="bx-view"><div class="bx-empty"><div class="bx-boot__spin" style="margin:0 auto"></div>' +
        '<div class="bx-empty__t" style="margin-top:14px">Loading…</div></div></div>';
      BIX.api.loadFor(id).then(function () {
        renderShell();
        renderSwitcher();
        BIX.app.rerender();
        BIX.toast('Viewing ' + (BIX.data.client.business || 'client'));
      });
    });
  }

  /* --------------------------------- router ------------------------------- */
  var current = null;

  function go(id) {
    if (BIX.isHidden(id)) return;
    var item = findItem(id);
    var view = BIX.views[id];
    if (!item || !view) { if (id !== 'dashboard') go('dashboard'); return; }

    current = id;
    if (location.hash.slice(1) !== id) location.hash = id;

    document.querySelectorAll('.bx-nav__item').forEach(function (b) {
      var on = b.getAttribute('data-go') === id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });

    document.getElementById('bxTopTitle').textContent = item.name;
    document.getElementById('bxTopSub').textContent = item.sub || '';

    var host = document.getElementById('bxView');
    host.innerHTML = '<div class="bx-view' + (view.wide ? ' bx-view--wide' : '') + '">' + view.render() + '</div>';
    if (view.mount) view.mount(host.firstChild);

    document.getElementById('bxViewWrap').scrollTop = 0;
    window.scrollTo(0, 0);
    closeDrawer();
    closePop();
  }

  BIX.app = {
    go: go,
    current: function () { return current; },
    rerender: function () { if (current) go(current); },

    boot: function () {
      var boot = document.getElementById('bxBoot');
      var msg = document.getElementById('bxBootMsg');
      var app = document.getElementById('bxApp');

      /* Real session, real data. No session → back to the sign-in page. */
      BIX.api.load().then(function () {
        renderShell();
        renderSwitcher();
        boot.hidden = true;
        app.hidden = false;

        var start = location.hash.slice(1);
        go(BIX.views[start] && !BIX.isHidden(start) ? start : 'dashboard');
      }).catch(function (err) {
        if (err === 'no session') return;          // already redirecting
        msg.textContent = (err && err.message) || 'Could not load your portal.';
        msg.style.color = '#C2402F';
        var back = document.createElement('a');
        back.className = 'bx-btn bx-btn--ghost bx-btn--sm';
        back.style.marginTop = '14px';
        back.href = '../login.html';
        back.textContent = 'Back to sign in';
        msg.parentNode.appendChild(back);
      });

      /* delegated navigation — any [data-go] anywhere routes */
      document.addEventListener('click', function (e) {
        var t = e.target.closest('[data-go]');
        if (t) { e.preventDefault(); go(t.getAttribute('data-go')); }
      });

      /* topbar */
      document.getElementById('bxBurger').addEventListener('click', openDrawer);
      document.getElementById('bxScrim').addEventListener('click', closeDrawer);
      document.getElementById('bxSearchBtn').addEventListener('click', function () {
        BIX.modal({
          title: 'Search',
          body: '<div class="bx-field"><label for="bxSearchM">What are you looking for?</label>' +
                '<input id="bxSearchM" type="search" placeholder="Invoice, file, request…" /></div>',
          foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>'
        });
      });

      document.getElementById('bxBell').addEventListener('click', function () {
        var d = BIX.data;
        BIX.modal({
          title: 'Notifications',
          body: d.notifications.length
            ? '<div class="bx-stack">' + d.notifications.map(function (n) {
                return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(n.t) + '</div>' +
                  '<div class="bx-mini__s">' + H.esc(n.w) + '</div></div>' +
                  '<span class="bx-pill bx-pill--' + n.kind + '">New</span></div>';
              }).join('') + '</div>'
            : H.empty('bell', 'Nothing new', 'You are all caught up.'),
          foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>'
        });
      });

      var avatar = document.getElementById('bxAvatar');
      avatar.addEventListener('click', function (e) {
        e.stopPropagation();
        var pop = document.getElementById('bxPop');
        pop.hidden = !pop.hidden;
        avatar.setAttribute('aria-expanded', String(!pop.hidden));
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('#bxPop') && !e.target.closest('#bxAvatar')) closePop();
      });
      document.getElementById('bxPop').addEventListener('click', function (e) {
        if (e.target.closest('#bxLogout')) {
          BixAuth.sb.auth.signOut().then(function () { location.href = '../login.html'; });
        }
      });

      window.addEventListener('hashchange', function () {
        var id = location.hash.slice(1);
        if (id && id !== current) go(id);
      });
    }
  };
})();
