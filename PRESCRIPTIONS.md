# Prescriptions

A ledger of every bug found in this codebase: the symptom you'd actually see,
the root cause, the fix, and — the useful part — **how to detect it again in
one step**. When we build something new, run the checks at the bottom before
calling it done.

Format per entry: **Symptom → Cause → Fix → Check**.

---

## RX-01 · Console hangs on a loading screen, no error anywhere

**Symptom** `/admin/` sits on "Loading the console…" forever. Nothing in the
console at first glance.

**Cause** `admin-data.js` created the `BIX` namespace as a side effect. Deleting
it left `admin-api.js` — which loads *before* `admin-app.js` — referencing an
undefined `BIX`. It threw partway and never reached `BIX.api = api`. Boot then
called `undefined.load()`, which throws *synchronously*, before the `.catch()`
that would have displayed a message.

**Fix** Every file that assigns onto the namespace creates it first:
`window.BIX = window.BIX || {};`

**Check** Console tracking must be started *before* the page loads or you see
nothing. Then:
```js
typeof BIX.api        // 'object', not 'undefined'
```

---

## RX-02 · A view throws only after switching to real data

**Symptom** `TypeError: Cannot read properties of undefined (reading 'today')`
at module scope.

**Cause** `views-business.js` initialised calendar state from `BIX.data.today`
at *parse* time. Fine when data was a synchronous fixture; impossible once it
arrives over the network.

**Fix** Lazy-init on first render (`calInit()`), never at module scope.

**Check**
```bash
grep -nE "^\s*var .*=.*BIX\.data" admin/*.js portal/*.js   # must return nothing
```

---

## RX-03 · Icons render enormous

**Symptom** Card-footer arrows at 94×94px; board toggle icons at 42px.

**Cause** Inline SVGs have no intrinsic size. Any container without an explicit
`width`/`height` rule sizes them to its own box. `.bx-linkish` and `.bx-seg__b`
had no rule.

**Fix** Size the icon in every container that holds one.

**Check** Paste in any page — lists every oversized icon and its container:
```js
[...document.querySelectorAll('svg')]
  .filter(s => s.getBoundingClientRect().width > 24)
  .map(s => s.parentElement.className + ' → ' + Math.round(s.getBoundingClientRect().width))
```
(`.bx-empty` at 44 and `.bx-ring` are intentional — everything else is a bug.)

---

## RX-04 · Numbers go NaN or misleading on an empty database

**Symptom** Broken SVG paths; "▼100% vs last month" on a figure that never moved.

**Cause** Three divide-by-zeros that only appear with no data: revenue chart
scale (`max` of all-zero series), funnel bar widths (`count / top`), and a
month-over-month delta with no prior month. Separately, the MRR tile's delta was
computed from *collected cash* — a different number than the one it sat under.

**Fix** `|| 1` guards on every denominator. A delta with no basis returns
`null` and renders as nothing rather than a confident 0%.

**Check** Empty state is the state every new install starts in — test it first,
not last:
```js
JSON.stringify(BIX.data.totals) + JSON.stringify(BIX.data.deltas)
// no NaN, no null-as-zero
```

---

## RX-05 · Edge Function rejects a genuine admin as "Invalid session"

**Symptom** Every call to `invite-client` returns 401 Invalid session, though
the browser is signed in as admin.

**Cause** `supabase.functions.invoke()` sends the **anon key** as the
Authorization header, not the user's access token. The function resolved no
user from it.

**Fix** Pass the header explicitly:
```js
sb.auth.getSession().then(s =>
  sb.functions.invoke(name, {
    body, headers: { Authorization: 'Bearer ' + s.data.session.access_token }
  }))
```

**Check** Anon keys are `HS256` (`eyJhbGciOiJIUzI1NiI`), user tokens are
asymmetric (`eyJhbGciOiJF`). Compare what's sent against the session:
```js
const s = await sb.auth.getSession();
s.data.session.access_token.slice(0,12)   // must match what the network tab sends
```

---

## RX-06 · Reads work but writes silently fail

**Symptom** A table loads fine; updating a row does nothing and reports no error.

**Cause** RLS decides *which rows*; GRANTs decide whether the table is reachable
at all. Both are required, and they fail differently. Separately, admin had
`select` on `profiles` but no write policy, so onboarding failed at the RLS layer.

**Fix** For every new table: enable RLS, add the policy, **and** grant to
`authenticated`. For every new *action*, check a policy covers that verb —
`for select` does not imply `for update`.

**Check**
```sql
select tablename, policyname, cmd from pg_policies where schemaname='public'
order by tablename, cmd;
```
Every table an admin writes needs a row with `cmd` = `ALL` or the specific verb.

---

## RX-07 · A CSS shorthand silently kills an unrelated property

**Symptom** Site content ran edge-to-edge on phones despite `.wrap` setting a
gutter.

**Cause** `.section { padding: 120px 0 }` and `.wrap { padding: 0 40px }` have
equal specificity. Several elements carry both classes, so the later shorthand
zeroed the horizontal gutter.

**Fix** Use the axis-specific property (`padding-block`) when a rule only means
to set one axis.

**Check** For any element with two layout classes, compare computed against
intent:
```js
getComputedStyle(document.querySelector('.section.wrap')).padding
```

---

## RX-08 · Mobile toggle renders an empty view

**Symptom** Leads/Projects blank on a phone; the toggle still reads "Board".

**Cause** The board was hidden in CSS at ≤560px while the JS still considered
board mode active — so it rendered a hidden element and nothing else.

**Fix** Switch modes in **JS** at that width, so the toggle can never claim a
state it isn't rendering. CSS hiding and JS state must not disagree.

**Check** At 390px wide, every view must contain visible content:
```js
document.querySelector('#bxView .bx-view').innerText.trim().length > 0
```

---

## RX-09 · Verified fix appears not to work

**Symptom** A confirmed-correct file change has no effect in the browser.

**Cause** Chrome served a cached `.js`/`.css`. A query string on the *HTML*
does not bust cached sub-resources.

**Fix / Check** Force-refetch the assets, then reload:
```js
await Promise.all(['admin-api.js','admin.css'].map(f => fetch(f, {cache:'reload'})));
location.reload();
```
Always confirm what the *server* returns before debugging further:
`curl -s <url>/file.js | grep <the-fix>`

---

---

## RX-10 · Whole page dimmed and unclickable

**Symptom** Every page greyed out; no button responds. Looks like a stuck
modal, but no modal is open.

**Cause** `portal.css` defines `.bx-scrim` as a permanently-visible full-screen
fixed layer and hides it by toggling the `hidden` **attribute from JS**. The
admin console reused the markup but drives its drawer from a body class, and
only ever set the scrim *on* — never off. It sat over everything at every
width, dimming the page and swallowing clicks.

**Fix** Default the scrim off in CSS (`opacity: 0; pointer-events: none`) and
let the `≤820px` drawer rule turn it on.

**Check** The element under the middle of the screen should be content, never a
scrim:
```js
document.elementFromPoint(innerWidth/2, innerHeight/2).className
```
More generally — list any full-screen layer that is capturing clicks:
```js
[...document.querySelectorAll('body *')].filter(e => {
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return s.position === 'fixed' && r.width >= innerWidth*0.9
      && r.height >= innerHeight*0.9 && s.pointerEvents !== 'none';
}).map(e => e.id || e.className);
```

**Lesson** When borrowing markup from another app, check *how* the original
hides it. A shared stylesheet can carry an assumption its JS enforces.

---

## RX-11 · Edge Function gets "permission denied" holding a valid service key

**Symptom** A function using the service-role key returns 403 for a genuine
admin. Its profile lookup fails even though the row exists and the same query
works from the browser.

**Cause** `service_role` had no GRANT on `public.profiles`. The schema granted
to `authenticated` only. RLS was never involved — the table was simply
unreachable for that role, so `.single()` returned no row and the admin check
rejected a real admin.

This is RX-06 wearing a different hat: the first time it bit `authenticated`,
this time `service_role`. **Edge Functions do not run as `authenticated`.**

**Fix**
```sql
grant all privileges on all tables in schema public to service_role;
alter default privileges in schema public
  grant all privileges on tables to service_role;   -- covers future tables
```

**Check** Never guess at an auth failure — make the function report what it
saw. A 403 that returns the caller's own resolved id, role, lookup error and
whether it holds a privileged key turns an hour of guessing into one call:
```js
{ error:'Unauthorized', seenUserId: user.id, seenRole: profile?.role ?? null,
  lookupError: err?.message ?? null, privileged: secretKey.length > 0 }
```
That is the caller's own identity, so it leaks nothing. It separates "you are
not an admin" from "I could not read your row at all" — different bugs that
look identical from outside.

```sql
-- who can actually reach a table
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='profiles' order by 1;
```

---

## RX-12 · A "dry run" that wasn't — real emails sent to real clients

**Symptom** A run described as a preview sent four live invoice emails to four
real clients, dated four weeks in the past.

**Cause** Two failures compounding.

1. **The dry-run mode did not exist.** The function reported a `dryRun` field,
   but it only meant *"no API key was found, so nothing could be sent"*. The
   moment a key was configured, the same call sent for real. A flag that
   describes a missing dependency was read as a safety mode.
2. **No billing window.** It billed `current month` regardless of the date, so
   running on the 31st raised invoices dated the 1st, due the 3rd — instantly
   overdue, and one scheduled run away from sending late-payment chasers.

**Fix** An explicit `{dry:true}` that changes nothing and reports what it
*would* do, plus a billing window (days 1–3, `force` to override) so a
mid-month run cannot backfill a period already underway.

**Check** Before any job that can reach a customer:
```bash
# must report intent and change nothing
curl -s -X POST "$FN" -H "Authorization: Bearer $KEY" -d '{"dry":true}'
# then confirm nothing was written
select count(*) from invoices where sent_at > now() - interval '5 minutes';
```

**Lessons**

- **Never describe a run as safe unless a code path enforces it.** Check the
  flag actually gates the side effect; do not infer it from its name.
- **A side-effecting job needs a dry mode before it needs a schedule.**
- **Test against an address you own first.** Real client addresses are not
  where you discover a mode does not exist.
- Date-driven jobs must assert *when* they are allowed to run. "What month is
  it" is not the same question as "should I bill today".

## Pre-flight checklist

Run these before calling any feature done.

```bash
# 1. syntax
for f in admin/*.js portal/*.js; do node --check "$f" || echo "FAIL $f"; done

# 2. no module-scope reads of async data  (RX-02)
grep -nE "^\s*var .*=.*BIX\.data" admin/*.js portal/*.js

# 3. every namespace file self-initialises  (RX-01)
grep -L "window.BIX = window.BIX" admin/admin-api.js admin/admin-app.js
```

In the browser, on the page under test:

```js
// 4. oversized icons (RX-03)
[...document.querySelectorAll('svg')].filter(s=>s.getBoundingClientRect().width>24)
  .map(s=>s.parentElement.className);

// 5. no runtime errors across every view (RX-01, RX-02)
const errs=[]; addEventListener('error',e=>errs.push(e.message));
for (const id of Object.keys(BIX.views)) { BIX.app.go(id); await new Promise(r=>setTimeout(r,200)); }
errs;

// 6. empty-state maths (RX-04)
JSON.stringify(BIX.data.totals);   // no NaN

// 7. nothing full-screen is eating clicks (RX-10)
document.elementFromPoint(innerWidth/2, innerHeight/2).className;

// 8. mobile has content (RX-08) — in a 390px iframe
```
