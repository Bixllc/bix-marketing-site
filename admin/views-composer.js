/* ==========================================================================
   views-composer.js — message composer.

   A modal, not a routed view: it is opened from the leads drawer, the nurture
   templates and the campaign detail, and needs to sit on top of whichever of
   those is already open.
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon;

  var TAGS = ['first_name', 'business', 'plan'];

  function audience() {
    var out = [];
    BIX.data.clients.forEach(function (c) {
      out.push({ id: 'c:' + c.id, name: c.business, who: c.contact, plan: c.plan, kind: 'Client' });
    });
    BIX.data.leads.forEach(function (l) {
      out.push({ id: 'l:' + l.id, name: l.business, who: l.contact, plan: '—', kind: 'Lead' });
    });
    return out;
  }

  /* Substitutes merge tags from the first recipient so the preview shows what
     that person actually receives, not the raw template. */
  function fill(text, r) {
    if (!r) return text;
    return String(text)
      .replace(/\{\{\s*first_name\s*\}\}/g, String(r.who || '').split(' ')[0] || 'there')
      .replace(/\{\{\s*business\s*\}\}/g, r.name || '')
      .replace(/\{\{\s*plan\s*\}\}/g, r.plan || '');
  }

  BIX.composer = function (opts) {
    opts = opts || {};
    var live = BIX.channels();
    if (!live.length) { BIX.toast('No messaging channels are enabled'); return; }

    var channel = opts.channel && BIX.channelOk(opts.channel) ? opts.channel : live[0].id;
    var picked = [];
    if (opts.to) {
      picked.push({ id: 'l:' + opts.to.id, name: opts.to.business, who: opts.to.contact, plan: '—', kind: 'Lead' });
    }

    BIX.modal({
      wide: true,
      title: opts.template ? 'Compose — ' + opts.template : 'Compose message',
      body:
        '<div class="bx-comp">' +
          '<div class="bx-comp__l">' +
            (live.length > 1 ? '<div class="bx-seg bx-seg--full" role="group" aria-label="Channel">' +
              live.map(function (c) {
                return '<button class="bx-seg__b' + (c.id === channel ? ' is-on' : '') + '" data-ch="' + H.esc(c.id) + '">' +
                  I(c.icon) + ' ' + H.esc(c.label) + '</button>';
              }).join('') + '</div>' : '') +

            '<div class="bx-field"><label for="cmTo">To</label>' +
              '<div class="bx-chipbox" id="cmChips"></div>' +
              '<input id="cmTo" autocomplete="off" placeholder="Search clients and leads…" ' +
                'role="combobox" aria-expanded="false" aria-controls="cmSug" aria-autocomplete="list" />' +
              '<div class="bx-sug" id="cmSug" role="listbox" aria-label="Recipients"></div>' +
            '</div>' +

            '<div class="bx-field" id="cmSubjWrap"><label for="cmSubj">Subject</label>' +
              '<input id="cmSubj" value="' + H.esc(opts.subject || '') + '" /></div>' +

            '<div class="bx-field"><label for="cmBody">Message</label>' +
              '<div class="bx-tags bx-mono" role="group" aria-label="Insert a merge tag">' +
                '<span>Insert:</span>' + TAGS.map(function (t) {
                  return '<button type="button" class="bx-tag" data-tag="' + t + '">{{' + t + '}}</button>';
                }).join('') + '</div>' +
              '<textarea id="cmBody" rows="9">' + H.esc(opts.body || '') + '</textarea>' +
              '<div class="bx-field__hint bx-mono" id="cmCount"></div>' +
            '</div>' +
          '</div>' +

          '<div class="bx-comp__r">' +
            '<div class="bx-comp__pk bx-mono">Preview</div>' +
            '<div class="bx-phone" id="cmPrev"></div>' +
          '</div>' +
        '</div>',

      foot: '<button class="bx-btn bx-btn--ghost" id="cmDraft">Save draft</button>' +
            '<button class="bx-btn bx-btn--primary" id="cmSend">Send</button>',

      mount: function (w) {
        var toInput = w.querySelector('#cmTo');
        var sug = w.querySelector('#cmSug');
        var chips = w.querySelector('#cmChips');
        var subjWrap = w.querySelector('#cmSubjWrap');
        var subj = w.querySelector('#cmSubj');
        var body = w.querySelector('#cmBody');
        var count = w.querySelector('#cmCount');
        var prev = w.querySelector('#cmPrev');
        var pool = audience();

        function paintChips() {
          chips.innerHTML = picked.map(function (p, i) {
            return '<span class="bx-chip2">' + H.esc(p.name) +
              '<button class="bx-chip2__x" data-rm="' + i + '" aria-label="Remove ' + H.esc(p.name) + '">' + I('x') + '</button></span>';
          }).join('');
          chips.classList.toggle('is-empty', !picked.length);
          chips.querySelectorAll('[data-rm]').forEach(function (b) {
            b.addEventListener('click', function () {
              picked.splice(Number(b.getAttribute('data-rm')), 1);
              paintChips(); paint();
            });
          });
        }

        function closeSug() {
          sug.classList.remove('is-open');
          toInput.setAttribute('aria-expanded', 'false');
        }

        function runSug() {
          var q = toInput.value.trim().toLowerCase();
          var hits = pool.filter(function (p) {
            return picked.every(function (x) { return x.id !== p.id; }) &&
              (!q || (p.name + ' ' + p.who).toLowerCase().indexOf(q) > -1);
          }).slice(0, 8);
          if (!hits.length) { closeSug(); return; }
          sug.innerHTML = hits.map(function (p) {
            return '<button class="bx-sug__r" role="option" data-add="' + H.esc(p.id) + '">' +
              '<span class="bx-sug__n">' + H.esc(p.name) + '<span>' + H.esc(p.who) + '</span></span>' +
              '<span class="bx-pill bx-pill--neutral">' + H.esc(p.kind) + '</span></button>';
          }).join('');
          sug.classList.add('is-open');
          toInput.setAttribute('aria-expanded', 'true');
          sug.querySelectorAll('[data-add]').forEach(function (b) {
            b.addEventListener('mousedown', function (e) {
              e.preventDefault();
              var p = pool.filter(function (x) { return x.id === b.getAttribute('data-add'); })[0];
              if (p) { picked.push(p); toInput.value = ''; paintChips(); closeSug(); paint(); }
            });
          });
        }

        function paint() {
          var isEmail = channel === 'email';
          subjWrap.style.display = isEmail ? '' : 'none';

          if (channel === 'sms') {
            var n = body.value.length;
            count.textContent = n + ' chars · ' + Math.max(1, Math.ceil(n / 160)) + ' segment' + (n > 160 ? 's' : '');
          } else {
            count.textContent = body.value.length + ' chars';
          }

          var r = picked[0];
          var bodyHtml = H.esc(fill(body.value, r)).replace(/\n/g, '<br>') ||
            '<span class="bx-faint">Your message appears here.</span>';

          prev.innerHTML =
            '<div class="bx-phone__hd bx-mono">' + H.esc(channel === 'email' ? 'Email' : channel === 'sms' ? 'SMS' : 'Social') +
              ' · ' + (r ? H.esc(r.name) : 'no recipient') + '</div>' +
            '<div class="bx-phone__b">' +
              (isEmail && subj.value ? '<div class="bx-phone__s">' + H.esc(fill(subj.value, r)) + '</div>' : '') +
              '<div class="bx-phone__t">' + bodyHtml + '</div>' +
            '</div>' +
            (picked.length > 1 ? '<div class="bx-phone__ft bx-mono">+ ' + (picked.length - 1) + ' more recipient' +
              (picked.length > 2 ? 's' : '') + '</div>' : '');
        }

        w.querySelectorAll('[data-ch]').forEach(function (b) {
          b.addEventListener('click', function () {
            channel = b.getAttribute('data-ch');
            w.querySelectorAll('[data-ch]').forEach(function (x) {
              x.classList.toggle('is-on', x === b);
            });
            paint();
          });
        });

        /* Merge tags insert at the caret rather than appending, so they can be
           dropped mid-sentence. */
        w.querySelectorAll('[data-tag]').forEach(function (b) {
          b.addEventListener('click', function () {
            var tag = '{{' + b.getAttribute('data-tag') + '}}';
            var s = body.selectionStart, e = body.selectionEnd;
            body.value = body.value.slice(0, s) + tag + body.value.slice(e);
            body.focus();
            body.selectionStart = body.selectionEnd = s + tag.length;
            paint();
          });
        });

        toInput.addEventListener('focus', runSug);
        toInput.addEventListener('input', runSug);
        toInput.addEventListener('blur', function () { setTimeout(closeSug, 120); });
        body.addEventListener('input', paint);
        subj.addEventListener('input', paint);

        w.querySelector('#cmDraft').addEventListener('click', function () {
          BIX.closeModal();
          BIX.toast('Draft saved');
        });

        w.querySelector('#cmSend').addEventListener('click', function () {
          if (!picked.length) { BIX.toast('Add at least one recipient'); return; }
          if (!body.value.trim()) { BIX.toast('Write a message first'); return; }
          var who = picked.length === 1 ? picked[0].name : picked.length + ' recipients';
          BIX.api.log('sent a ' + H.esc(channel) + ' message to <b>' + H.esc(who) + '</b>');
          BIX.closeModal();
          BIX.toast('Sent to ' + who);
          if (BIX.app.current() === 'dashboard') BIX.app.rerender();
        });

        paintChips();
        paint();
      }
    });
  };
})();
