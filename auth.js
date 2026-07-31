/* ==========================================================================
   auth.js — shared Supabase client + role routing for the portal pages.
   Load after the Supabase UMD bundle and before any page script.
   Exposes window.BixAuth.
   ========================================================================== */
(function (global) {
  'use strict';

  var SUPA_URL = 'https://mvgyjeocdsngldirehlv.supabase.co';
  // Anon key — safe to ship. Row Level Security is what actually guards data.
  var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z3lqZW9jZHNuZ2xkaXJlaGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTEwMjUsImV4cCI6MjA5ODMyNzAyNX0.zUzw9X-WPUZ454WU27TI-Svjcs6VycSITmxxZHBSBlQ';

  /* ---- Session persistence -------------------------------------------------
     "Keep me signed in" decides *where* the token lives: localStorage survives
     a browser restart, sessionStorage dies with the tab. The preference itself
     always lives in localStorage so the choice is remembered. The adapter
     resolves the target on every call, so setPersistence() can be set right
     before sign-in and the token lands in the right place. */
  var PERSIST_KEY = 'bix.persist';

  function target() {
    try {
      return localStorage.getItem(PERSIST_KEY) === 'session' ? sessionStorage : localStorage;
    } catch (_) { return localStorage; }
  }

  var storage = {
    getItem: function (k) {
      try { return target().getItem(k); } catch (_) { return null; }
    },
    setItem: function (k, v) {
      try { target().setItem(k, v); } catch (_) {}
    },
    // Remove from both, so a stale copy can never resurrect a signed-out session.
    removeItem: function (k) {
      try { localStorage.removeItem(k); } catch (_) {}
      try { sessionStorage.removeItem(k); } catch (_) {}
    }
  };

  function setPersistence(remember) {
    try {
      localStorage.setItem(PERSIST_KEY, remember ? 'local' : 'session');
      // Drop any token held by the store we're no longer using.
      var stale = remember ? sessionStorage : localStorage;
      Object.keys(stale)
        .filter(function (k) { return k.indexOf('sb-') === 0 && k.indexOf('auth-token') > -1; })
        .forEach(function (k) { stale.removeItem(k); });
    } catch (_) {}
  }

  var sb = global.supabase.createClient(SUPA_URL, SUPA_KEY, {
    auth: {
      storage: storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  /* Absolute URL for an auth email to return to. Built from the current page
     so invite/reset links work on localhost and in production alike — each
     origin must also be listed under Supabase → Authentication → URL
     Configuration → Redirect URLs. */
  function returnTo(page) {
    return new URL(page, global.location.href).href;
  }

  /* Supabase reports bad/expired links in the URL fragment, e.g.
     #error=access_denied&error_code=otp_expired&error_description=... */
  function linkError() {
    var h = (global.location.hash || '').replace(/^#/, '');
    if (!h) return null;
    var p = new URLSearchParams(h);
    if (!p.get('error') && !p.get('error_code')) return null;
    return {
      code: p.get('error_code') || p.get('error') || 'invalid',
      description: (p.get('error_description') || '').replace(/\+/g, ' ')
    };
  }

  /* Strip the token fragment once consumed so a refresh or a shared URL
     can't replay it and the address bar stays clean. */
  function clearHash() {
    if (!global.location.hash) return;
    history.replaceState(null, '', global.location.pathname + global.location.search);
  }

  /* Where a signed-in user belongs. Defaults to the client portal — that page
     re-checks the role itself, and RLS is the real boundary either way. */
  /* An admin lands in the agency console; a client lands in their portal.
     Each destination re-checks the role itself, and RLS is the real boundary
     either way — this only decides which door opens first. The console's
     account menu links across to the client view. */
  function portalFor(role) {
    return role === 'admin' ? 'admin/' : 'portal/';
  }

  function roleOf(uid) {
    return sb.from('profiles').select('role').eq('id', uid).single()
      .then(function (res) { return (res.data && res.data.role) || 'client'; })
      .catch(function () { return 'client'; });
  }

  function goToPortal(uid) {
    return roleOf(uid).then(function (role) {
      global.location.href = portalFor(role);
    });
  }

  /* Wait for a session to materialise. Magic-link tokens are parsed out of the
     URL asynchronously, so a bare getSession() on load can race and come back
     empty. Resolves with the session, or null once `ms` elapses. */
  function awaitSession(ms) {
    return new Promise(function (resolve) {
      var settled = false;
      function finish(session) {
        if (settled) return;
        settled = true;
        if (sub && sub.subscription) sub.subscription.unsubscribe();
        clearTimeout(timer);
        resolve(session || null);
      }

      var res = sb.auth.onAuthStateChange(function (_event, session) {
        if (session) finish(session);
      });
      var sub = res && res.data;

      var timer = setTimeout(function () { finish(null); }, ms || 6000);

      sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) finish(r.data.session);
      });
    });
  }

  /* Supabase error messages are terse and sometimes leak detail. Map the ones
     worth distinguishing; fall back to a generic line. */
  function signInMessage(error) {
    var m = (error && error.message ? error.message : '').toLowerCase();
    if (m.indexOf('email not confirmed') > -1) {
      return 'That email has not been confirmed yet. Check your inbox for the invite link.';
    }
    if (m.indexOf('rate limit') > -1 || m.indexOf('too many') > -1) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return 'Invalid email or password. Please try again.';
  }

  global.BixAuth = {
    sb: sb,
    setPersistence: setPersistence,
    returnTo: returnTo,
    linkError: linkError,
    clearHash: clearHash,
    portalFor: portalFor,
    roleOf: roleOf,
    goToPortal: goToPortal,
    awaitSession: awaitSession,
    signInMessage: signInMessage
  };
})(window);
