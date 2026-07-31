/* ==========================================================================
   admin-app.js — icons, helpers, shell, router, command search.
   Loaded after admin-data.js and before the view files.
   ========================================================================== */
window.BIX = window.BIX || {};
BIX.views = BIX.views || {};

/* Features switched off for launch. Every cross-reference in every view is
   gated on this, so a hidden feature leaves no dead button behind. */
BIX.hidden = ['messages', 'booking', 'ai'];
BIX.isHidden = function (id) { return BIX.hidden.indexOf(id) > -1; };

(function () {
  'use strict';

  /* --------------------------------- icons -------------------------------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1"/>',
    send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8z"/>',
    users: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.5 19.5c0-3.4 2.9-5.8 6.5-5.8s6.5 2.4 6.5 5.8"/><path d="M16.5 5.6a3.4 3.4 0 0 1 0 6.4"/><path d="M18 13.9c2.1.6 3.5 2.3 3.5 4.4"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5"/>',
    money: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.3a2.8 2.8 0 0 0-2.5-1.3c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.7.8 2.7 2-1.1 2-2.7 2a2.9 2.9 0 0 1-2.6-1.4"/><path d="M12 6.4v11.2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m6 9.5 6 6 6-6"/>',
    chevR: '<path d="m9.5 6 6 6-6 6"/>',
    chevL: '<path d="m14.5 6-6 6 6 6"/>',
    arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9z"/><path d="M13.7 19.5a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/>',
    logout: '<path d="M14 5.5V4a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 4 4v16a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 20v-1.5"/><path d="M9 12h11"/><path d="m16.5 8.5 3.5 3.5-3.5 3.5"/>',
    inbox: '<path d="M3.5 13h4l1.5 3h6l1.5-3h4"/><path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>',
    ticket: '<path d="M4 8.5V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v2a2.5 2.5 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-2a2.5 2.5 0 0 0 0-7z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h4"/>',
    building: '<path d="M4 20V6a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13 6v14"/><path d="M13 10h5.5A1.5 1.5 0 0 1 20 11.5V20"/><path d="M3 20h18"/><path d="M7 8.5h2M7 12h2M7 15.5h2M16 13.5h1M16 17h1"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.6 7 8.4 6 8.4-6"/>',
    phone: '<path d="M7 3.5h3l1.5 4L9.5 9a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.7 2 2 0 0 1 5.5 3.5z"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>',
    trash: '<path d="M4 6.5h16"/><path d="M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7"/><path d="M6 6.5 7 20a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13.5"/>',
    edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6.5 17.5 9.5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5"/>',
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M21 19H3"/>',
    filter: '<path d="M3.5 5.5h17l-6.5 7.5V20l-4-2.2v-5.3z"/>',
    flame: '<path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.9-3.4-5.6-4.2-9.4-2 1-2.8 3-2.8 4.6 0 1-.6 1.6-1.3 1.6-.8 0-1.3-.7-1.3-1.8C7 12 6 13.4 6 15.4 6 18.6 8.4 21 12 21z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    list: '<path d="M8 6.5h13M8 12h13M8 17.5h13"/><path d="M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01"/>',
    warn: '<path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    zap: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
    link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.4 6.4"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.4-1.4"/>'
  };

  BIX.icon = function (name, cls) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : '') + '>' + (P[name] || P.file) + '</svg>';
  };

  /* -------------------------------- helpers -------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function money0(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function pct(n) { return (Math.round(Number(n || 0) * 10) / 10) + '%'; }

  BIX.esc = esc; BIX.money = money; BIX.money0 = money0; BIX.pct = pct;

  var H = {
    esc: esc, money: money, money0: money0, pct: pct,

    date: function (iso, style) {
      var d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
      if (style === 'long') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (style === 'day') return String(d.getDate());
      if (style === 'mon') return d.toLocaleDateString('en-US', { month: 'short' });
      if (style === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    /* Relative time against BIX.data.today, so the mock content reads as "now"
       without depending on the real clock. */
    ago: function (iso) {
      var then = new Date(String(iso).length > 10 ? iso : iso + 'T12:00:00');
      var now = new Date(BIX.data.today + 'T18:00:00');
      var mins = Math.round((now - then) / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + 'm ago';
      var hrs = Math.round(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      var days = Math.round(hrs / 24);
      if (days < 7) return days + 'd ago';
      if (days < 30) return Math.round(days / 7) + 'w ago';
      return Math.round(days / 30) + 'mo ago';
    },

    /* One status→colour table so no view invents its own mapping. */
    tone: function (status) {
      var s = String(status).toLowerCase();
      if (['won', 'paid', 'active', 'live', 'launched', 'connected', 'complete'].indexOf(s) > -1) return 'green';
      if (['contacted', 'proposal', 'in progress', 'upcoming', 'build', 'scheduled'].indexOf(s) > -1) return 'blue';
      if (['qualified', 'outstanding', 'review', 'qa', 'at risk', 'design', 'pending'].indexOf(s) > -1) return 'amber';
      if (['lost', 'overdue', 'failed', 'blocked', 'paused'].indexOf(s) > -1) return 'red';
      return 'neutral';
    },
    pill: function (status) {
      return '<span class="bx-pill bx-pill--' + H.tone(status) + '">' + esc(status) + '</span>';
    },
    temp: function (t) {
      var tone = t === 'hot' ? 'red' : t === 'warm' ? 'amber' : 'neutral';
      return '<span class="bx-pill bx-pill--' + tone + '">' + esc(t) + '</span>';
    },

    /* Column count from the surviving item count — hiding a feature can never
       strand an empty grid column. A custom property, not an inline
       grid-template-columns, which would outrank the responsive rules. */
    autoCols: function (n, max) {
      return '--bx-cols: ' + Math.max(Math.min(n, max || 4), 1) + ';';
    },

    initials: function (name) {
      return String(name || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    },
    avatar: function (name, size) {
      return '<span class="bx-avatar' + (size ? ' bx-avatar--' + size : '') + '">' + esc(H.initials(name)) + '</span>';
    },
    member: function (id) {
      var t = BIX.data.team.filter(function (m) { return m.id === id; })[0];
      return t || { name: 'Unassigned', initials: '—', role: '' };
    },

    /* null means "no prior month to compare against" — render nothing rather
       than an authoritative-looking 0%. */
    delta: function (n) {
      if (n == null || isNaN(Number(n))) return '';
      var up = Number(n) >= 0;
      return '<div class="bx-stat__d bx-mono ' + (up ? 'is-up' : 'is-down') + '">' +
        (up ? '▲' : '▼') + ' ' + Math.abs(Number(n)) + '% <span>vs last month</span></div>';
    },

    stat: function (o) {
      return '<div class="bx-stat">' +
        '<span class="bx-stat__chip bx-stat__chip--' + (o.tone || 'purple') + '">' + BIX.icon(o.icon) + '</span>' +
        '<div class="bx-stat__k bx-mono">' + esc(o.k) + '</div>' +
        '<div class="bx-stat__v">' + o.v + '</div>' +
        (o.d == null ? '' : H.delta(o.d)) +
        (o.note ? '<div class="bx-stat__note bx-mono">' + esc(o.note) + '</div>' : '') +
        '</div>';
    },

    empty: function (icon, title, sub, cta) {
      return '<div class="bx-empty">' + BIX.icon(icon) +
        '<div class="bx-empty__t">' + esc(title) + '</div>' +
        '<div class="bx-empty__s">' + esc(sub) + '</div>' + (cta || '') + '</div>';
    },

    /* A card footer link into the view the card summarises. */
    more: function (id, label) {
      return '<div class="bx-card__foot"><button class="bx-linkish" data-go="' + esc(id) + '">' +
        esc(label) + ' ' + BIX.icon('arrow') + '</button></div>';
    }
  };
  BIX.h = H;

  /* --------------------------------- toast --------------------------------- */
  BIX.toast = function (msg) {
    var root = document.getElementById('bxToasts');
    var el = document.createElement('div');
    el.className = 'bx-toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 240);
    }, 2600);
  };

  /* ------------------------- modal / drawer plumbing ------------------------ */
  var lastFocus = null;

  function trap(wrap) {
    var sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    wrap.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = wrap.querySelectorAll(sel);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  BIX.modal = function (opts) {
    BIX.closeModal();
    lastFocus = document.activeElement;
    var root = document.getElementById('bxModalRoot');
    var wrap = document.createElement('div');
    wrap.className = 'bx-modal' + (opts.wide ? ' bx-modal--wide' : '');
    wrap.innerHTML =
      '<div class="bx-modal__scrim" data-close></div>' +
      '<div class="bx-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="bxModalTitle">' +
        '<div class="bx-modal__head"><h3 id="bxModalTitle">' + esc(opts.title) + '</h3>' +
          '<button class="bx-modal__x" data-close aria-label="Close">' + BIX.icon('x') + '</button></div>' +
        '<div class="bx-modal__body">' + opts.body + '</div>' +
        (opts.foot ? '<div class="bx-modal__foot">' + opts.foot + '</div>' : '') +
      '</div>';
    root.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) BIX.closeModal(); });
    trap(wrap);
    var field = wrap.querySelector('input,select,textarea');
    (field || wrap.querySelector('.bx-modal__x')).focus();
    if (opts.mount) opts.mount(wrap);
    return wrap;
  };

  BIX.closeModal = function () {
    var root = document.getElementById('bxModalRoot');
    if (!root || !root.firstChild) return;
    root.innerHTML = '';
    if (!document.getElementById('bxDrawerRoot').firstChild) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };

  /* Right-side panel for lead / client / project detail. Same contract as the
     modal so views can swap between them without rewriting handlers. */
  BIX.drawer = function (opts) {
    BIX.closeDrawer();
    lastFocus = document.activeElement;
    var root = document.getElementById('bxDrawerRoot');
    var wrap = document.createElement('div');
    wrap.className = 'bx-drawer';
    wrap.innerHTML =
      '<div class="bx-drawer__scrim" data-close></div>' +
      '<aside class="bx-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="bxDrawerTitle">' +
        '<header class="bx-drawer__head">' +
          '<div><div class="bx-drawer__eyebrow bx-mono">' + esc(opts.eyebrow || '') + '</div>' +
            '<h3 id="bxDrawerTitle">' + esc(opts.title) + '</h3></div>' +
          '<button class="bx-modal__x" data-close aria-label="Close">' + BIX.icon('x') + '</button>' +
        '</header>' +
        '<div class="bx-drawer__body">' + opts.body + '</div>' +
        (opts.foot ? '<footer class="bx-drawer__foot">' + opts.foot + '</footer>' : '') +
      '</aside>';
    root.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) BIX.closeDrawer(); });
    trap(wrap);
    /* Next frame so the slide-in transition has a start value to move from. */
    requestAnimationFrame(function () { wrap.classList.add('is-open'); });
    wrap.querySelector('.bx-modal__x').focus();
    if (opts.mount) opts.mount(wrap);
    return wrap;
  };

  BIX.closeDrawer = function () {
    var root = document.getElementById('bxDrawerRoot');
    if (!root || !root.firstChild) return;
    root.innerHTML = '';
    if (!document.getElementById('bxModalRoot').firstChild) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('bxModalRoot').firstChild) { BIX.closeModal(); return; }
    if (document.getElementById('bxDrawerRoot').firstChild) { BIX.closeDrawer(); return; }
    var pop = document.querySelector('.bx-pop.is-open');
    if (pop) pop.classList.remove('is-open');
  });

  /* Copy-to-clipboard used by contact rows in every drawer. */
  BIX.copy = function (text, label) {
    function done() { BIX.toast((label || 'Copied') + ' copied'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      ta.remove(); done();
    }
  };

  /* ------------------------------- nav model ------------------------------- */
  BIX.nav = [
    { group: 'Overview', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', sub: 'Today at a glance' }
    ] },
    { group: 'Growth', items: [
      { id: 'leads', label: 'Leads', icon: 'target', sub: 'Pipeline & CRM' },
      { id: 'nurture', label: 'Nurture', icon: 'send', sub: 'Campaigns & sequences' }
    ] },
    { group: 'Delivery', items: [
      { id: 'clients', label: 'Clients', icon: 'users', sub: 'Accounts & health' },
      { id: 'projects', label: 'Projects', icon: 'layers', sub: 'Active builds' }
    ] },
    { group: 'Business', items: [
      { id: 'revenue', label: 'Revenue', icon: 'money', sub: 'Invoices & income' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar', sub: 'Meetings & schedule' }
    ] },
    { group: 'Account', items: [
      { id: 'settings', label: 'Settings', icon: 'gear', sub: 'Agency & team' }
    ] }
  ];

  function findItem(id) {
    var hit = null;
    BIX.nav.forEach(function (g) {
      g.items.forEach(function (i) { if (i.id === id) hit = i; });
    });
    return hit;
  }

  /* Live badge counts. Recomputed on every shell render so they follow edits. */
  function badgeFor(id) {
    var t = BIX.data.totals;
    if (id === 'leads') return BIX.data.leads.filter(function (l) { return l.stage === 'new'; }).length;
    if (id === 'revenue') return BIX.data.invoices.filter(function (i) {
      return i.status === 'Outstanding' || i.status === 'Overdue';
    }).length;
    if (id === 'projects') return t.overdueBuilds || 0;
    return 0;
  }

  /* --------------------------------- shell --------------------------------- */
  function renderSidebar() {
    var founder = BIX.data.agency.founder;
    var groups = BIX.nav.map(function (g) {
      var items = g.items.filter(function (i) { return !BIX.isHidden(i.id); });
      if (!items.length) return '';
      return '<div class="bx-nav__group">' +
        '<div class="bx-nav__label bx-mono">' + esc(g.group) + '</div>' +
        items.map(function (i) {
          var n = badgeFor(i.id);
          return '<button class="bx-nav__item" data-go="' + esc(i.id) + '" type="button">' +
            '<span class="bx-nav__bar" aria-hidden="true"></span>' +
            BIX.icon(i.icon) +
            '<span class="bx-nav__txt">' + esc(i.label) + '</span>' +
            (n ? '<span class="bx-nav__n bx-mono">' + n + '</span>' : '') +
            '</button>';
        }).join('') + '</div>';
    }).join('');

    document.getElementById('bxSide').innerHTML =
      '<div class="bx-side__top">' +
        '<span class="bx-side__mark" aria-hidden="true"></span>' +
        '<div><div class="bx-side__biz">' + esc(BIX.data.agency.name) + '</div>' +
          '<div class="bx-side__id bx-mono">Agency</div></div>' +
      '</div>' +
      '<nav class="bx-nav" aria-label="Admin sections">' + groups + '</nav>' +
      '<div class="bx-side__foot">' +
        '<div class="bx-founder">' +
          H.avatar(founder) +
          '<div class="bx-founder__t"><div class="bx-founder__n">' + esc(founder) + '</div>' +
            '<div class="bx-founder__r bx-mono">Founder</div></div>' +
          '<button class="bx-iconbtn bx-founder__more" id="bxFounderMore" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>' +
          '</button>' +
          '<div class="bx-pop" id="bxFounderPop" role="menu">' +
            '<button class="bx-pop__item" data-go="settings" role="menuitem">' + BIX.icon('gear') + ' Settings</button>' +
            '<a class="bx-pop__item" href="../portal/" role="menuitem">' + BIX.icon('external') + ' Switch to client view</a>' +
            '<div class="bx-pop__sep"></div>' +
            '<button class="bx-pop__item" id="bxLogout" role="menuitem">' + BIX.icon('logout') + ' Log out</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var more = document.getElementById('bxFounderMore');
    var pop = document.getElementById('bxFounderPop');
    more.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pop.classList.toggle('is-open');
      more.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function () {
      pop.classList.remove('is-open');
      more.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('bxLogout').addEventListener('click', function () {
      BIX.api.signOut();
    });
  }

  function renderTop() {
    var unread = BIX.data.notifications.filter(function (n) { return n.unread; }).length;
    document.getElementById('bxTop').innerHTML =
      '<button class="bx-iconbtn bx-top__burger" id="bxBurger" aria-label="Open menu">' + BIX.icon('menu') + '</button>' +
      '<div class="bx-top__titles"><div class="bx-top__title" id="bxTitle">Dashboard</div>' +
        '<div class="bx-top__sub" id="bxSub">Today at a glance</div></div>' +
      '<div class="bx-top__right">' +
        '<div class="bx-search" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-owns="bxSearchList">' +
          '<span class="bx-search__ico">' + BIX.icon('search') + '</span>' +
          '<input id="bxSearch" type="text" class="bx-mono" autocomplete="off" ' +
            'placeholder="Search clients, leads, invoices…" aria-label="Search" ' +
            'aria-controls="bxSearchList" aria-autocomplete="list" />' +
          '<kbd class="bx-search__kbd bx-mono">⌘K</kbd>' +
          '<div class="bx-search__panel" id="bxSearchList" role="listbox" aria-label="Search results"></div>' +
        '</div>' +
        '<button class="bx-iconbtn bx-bell" id="bxBell" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' +
          BIX.icon('bell') + (unread ? '<span class="bx-bell__dot"></span>' : '') + '</button>' +
        H.avatar(BIX.data.agency.founder) +
      '</div>';

    document.getElementById('bxBurger').addEventListener('click', function () {
      document.body.classList.add('bx-drawer-open');
    });
    document.getElementById('bxBell').addEventListener('click', openNotifications);
    wireSearch();
  }

  function openNotifications() {
    var list = BIX.data.notifications;
    BIX.modal({
      title: 'Notifications',
      body: list.length ? '<div class="bx-notes">' + list.map(function (n) {
        return '<button class="bx-note' + (n.unread ? ' is-unread' : '') + '" data-go="' + esc(n.go) + '">' +
          '<span class="bx-note__dot" aria-hidden="true"></span>' +
          '<span class="bx-note__t">' + esc(n.what) + '</span>' +
          '<span class="bx-note__d bx-mono">' + H.date(n.when, 'short') + '</span></button>';
      }).join('') + '</div>'
        : H.empty('bell', 'Nothing new', 'Alerts about overdue invoices and slipping builds land here.'),
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>' +
            '<button class="bx-btn bx-btn--primary" id="bxReadAll">Mark all read</button>',
      mount: function (w) {
        w.querySelector('#bxReadAll').addEventListener('click', function () {
          BIX.data.notifications.forEach(function (n) { n.unread = false; });
          BIX.closeModal(); renderTop(); setTitle(current);
          BIX.toast('All notifications marked read');
        });
      }
    });
  }

  /* ----------------------------- command search ---------------------------- */
  BIX.app = BIX.app || {};

  BIX.app.searchIndex = function () {
    var d = BIX.data, out = [];
    d.clients.forEach(function (c) {
      out.push({ cat: 'Clients', icon: 'users', t: c.business, s: c.contact + ' · ' + c.plan, go: 'clients', ref: c.id });
    });
    d.leads.forEach(function (l) {
      out.push({ cat: 'Leads', icon: 'target', t: l.business, s: l.contact + ' · ' + BIX.money0(l.value), go: 'leads', ref: l.id });
    });
    d.projects.forEach(function (p) {
      out.push({ cat: 'Projects', icon: 'layers', t: p.title, s: p.client + ' · ' + p.phase, go: 'projects', ref: p.id });
    });
    d.campaigns.forEach(function (c) {
      out.push({ cat: 'Campaigns', icon: 'send', t: c.name, s: c.audience + ' · ' + c.status, go: 'nurture', ref: c.id });
    });
    d.invoices.forEach(function (i) {
      out.push({ cat: 'Invoices', icon: 'money', t: i.id + ' · ' + i.client, s: BIX.money0(i.amount) + ' · ' + i.status, go: 'revenue', ref: i.id });
    });
    BIX.nav.forEach(function (g) {
      g.items.filter(function (i) { return !BIX.isHidden(i.id); }).forEach(function (i) {
        out.push({ cat: 'Pages', icon: i.icon, t: i.label, s: i.sub, go: i.id });
      });
    });
    return out;
  };

  function wireSearch() {
    var box = document.querySelector('.bx-search');
    var input = document.getElementById('bxSearch');
    var panel = document.getElementById('bxSearchList');
    var idx = BIX.app.searchIndex();
    var hits = [], cursor = -1;

    function close() {
      panel.classList.remove('is-open');
      box.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      cursor = -1;
    }

    function paint() {
      if (!hits.length) {
        panel.innerHTML = '<div class="bx-search__none bx-mono">No matches</div>';
        return;
      }
      var lastCat = '', html = '', n = 0;
      hits.forEach(function (h) {
        if (h.cat !== lastCat) { html += '<div class="bx-search__cat bx-mono">' + esc(h.cat) + '</div>'; lastCat = h.cat; }
        html += '<button class="bx-search__row' + (n === cursor ? ' is-on' : '') + '" role="option" ' +
          'id="bxSr' + n + '" aria-selected="' + (n === cursor) + '" data-i="' + n + '">' +
          '<span class="bx-search__ri">' + BIX.icon(h.icon) + '</span>' +
          '<span class="bx-search__rt">' + esc(h.t) + '<span>' + esc(h.s) + '</span></span></button>';
        n++;
      });
      panel.innerHTML = html;
      if (cursor > -1) input.setAttribute('aria-activedescendant', 'bxSr' + cursor);
    }

    function run() {
      var q = input.value.trim().toLowerCase();
      hits = (q ? idx.filter(function (r) {
        return (r.t + ' ' + r.s).toLowerCase().indexOf(q) > -1;
      }) : idx.filter(function (r) { return r.cat === 'Pages'; })).slice(0, 40);
      cursor = hits.length ? 0 : -1;
      paint();
      panel.classList.add('is-open');
      box.setAttribute('aria-expanded', 'true');
    }

    function pick(i) {
      var h = hits[i];
      if (!h) return;
      close(); input.value = ''; input.blur();
      BIX.app.go(h.go, h.ref);
    }

    input.addEventListener('focus', function () { idx = BIX.app.searchIndex(); run(); });
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(cursor + 1, hits.length - 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(cursor - 1, 0); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(cursor); }
      else if (e.key === 'Escape') { close(); input.blur(); }
    });
    panel.addEventListener('mousedown', function (e) {
      var row = e.target.closest('[data-i]');
      if (row) { e.preventDefault(); pick(Number(row.getAttribute('data-i'))); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.bx-search')) close();
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var i = document.getElementById('bxSearch');
      if (i) { i.focus(); i.select(); }
    }
  });

  /* --------------------------------- router -------------------------------- */
  var current = null;

  function setTitle(id) {
    var item = findItem(id);
    if (!item) return;
    document.getElementById('bxTitle').textContent = item.label;
    document.getElementById('bxSub').textContent = item.sub;
    document.querySelectorAll('.bx-nav__item').forEach(function (b) {
      var on = b.getAttribute('data-go') === id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }

  function go(id, ref) {
    if (!id || BIX.isHidden(id) || !BIX.views[id]) id = 'dashboard';
    current = id;
    var view = BIX.views[id];
    if (location.hash.split(':')[0].replace('#', '') !== id) {
      history.replaceState(null, '', '#' + id);
    }
    setTitle(id);
    var host = document.getElementById('bxView');
    host.className = 'bx-viewwrap' + (view.wide ? ' bx-view--wide' : '');
    host.innerHTML = '<div class="bx-view">' + view.render(ref) + '</div>';
    if (view.mount) view.mount(host);
    document.getElementById('bxMain').scrollTop = 0;
    document.body.classList.remove('bx-drawer-open');
    /* Anything, anywhere, can navigate by carrying data-go. */
    host.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (b.closest('[data-go-skip]')) return;
        e.preventDefault();
        BIX.app.go(b.getAttribute('data-go'));
      });
    });
    if (view.after) view.after(host, ref);
  }

  BIX.app.go = go;
  BIX.app.current = function () { return current; };
  BIX.app.rerender = function () { if (current) go(current); };
  BIX.app.refreshChrome = function () { renderSidebar(); renderTop(); setTitle(current); };

  /* ---------------------------------- boot --------------------------------- */
  function start() {
    renderSidebar();
    renderTop();
    document.getElementById('bxScrim').addEventListener('click', function () {
      document.body.classList.remove('bx-drawer-open');
    });
    document.body.addEventListener('click', function (e) {
      var b = e.target.closest('#bxSide [data-go], #bxModalRoot [data-go], #bxDrawerRoot [data-go]');
      if (!b) return;
      e.preventDefault();
      BIX.closeModal(); BIX.closeDrawer();
      BIX.app.go(b.getAttribute('data-go'));
    });
    go((location.hash || '#dashboard').replace('#', '').split(':')[0]);
    window.addEventListener('hashchange', function () {
      var id = (location.hash || '#dashboard').replace('#', '').split(':')[0];
      if (id !== current) go(id);
    });
  }

  BIX.app.boot = function () {
    var boot = document.getElementById('bxBoot');
    var says = document.getElementById('bxBootT');

    function bail(msg, href) {
      says.textContent = msg;
      setTimeout(function () { location.href = href; }, 900);
    }

    BIX.api.load().then(function (res) {
      if (res && res.fatal === 'no-session') {
        bail('Sign in required…', '../login.html');
        return;
      }
      if (res && res.fatal === 'not-admin') {
        /* A client who reaches this URL is not an error — send them to the
           console that is theirs rather than showing a refusal. */
        bail('Opening your portal…', '../portal/');
        return;
      }
      boot.remove();
      start();
    }).catch(function (e) {
      says.textContent = 'Could not load the console: ' + e.message;
    });
  };
})();
