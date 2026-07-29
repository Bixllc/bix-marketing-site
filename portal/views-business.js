/* ==========================================================================
   Views: files, invoices, meetings, website, subscription
   ========================================================================== */
(function () {
  'use strict';
  var H = BIX.h, I = BIX.icon, stat = BIX.stat;

  /* ================================ FILES ================================ */
  var fileFolder = 'All';

  BIX.views.files = {
    wide: true,
    render: function () {
      var d = BIX.data;
      var folders = ['All'].concat(d.files.map(function (f) { return f.folder; })
        .filter(function (v, i, a) { return a.indexOf(v) === i; }));
      var rows = d.files.filter(function (f) { return fileFolder === 'All' || f.folder === fileFolder; });
      var pct = Math.round(d.storage.usedGb / d.storage.totalGb * 100);

      return '' +
      '<div class="bx-drop" id="flDrop">' + I('upload') +
        '<div class="bx-drop__t">Drop files here, or click to browse</div>' +
        '<div class="bx-mono bx-drop__s">Photos, copy, logos · up to 25 MB each</div>' +
        '<input type="file" id="flInput" multiple hidden /></div>' +

      '<div class="bx-sec"><div class="bx-sec__h">' +
        '<div class="bx-seg" id="flFolders">' + folders.map(function (f) {
          return '<button class="bx-seg__b' + (f === fileFolder ? ' is-on' : '') + '" data-f="' + H.esc(f) + '">' + H.esc(f) + '</button>';
        }).join('') + '</div>' +
        '<span class="bx-mono bx-faint">' + rows.length + ' file' + (rows.length === 1 ? '' : 's') + '</span>' +
      '</div>' +

      (rows.length ? '<div class="bx-files">' + rows.map(function (f) {
        var prev = f.kind === 'img' && f.src
          ? '<img src="' + H.esc(f.src) + '" alt="' + H.esc(f.name) + '" loading="lazy" />'
          : '<span class="bx-file__ext">' + H.esc(f.name.split('.').pop()) + '</span>';
        return '<div class="bx-file">' +
          '<div class="bx-file__prev">' + prev + '</div>' +
          '<div class="bx-file__b"><div class="bx-file__n" title="' + H.esc(f.name) + '">' + H.esc(f.name) + '</div>' +
            '<div class="bx-file__m">' + H.esc(f.size) + ' · ' + H.date(f.date) + '</div></div>' +
          '<div class="bx-file__acts">' +
            '<button class="bx-iconbtn" data-dl="' + H.esc(f.name) + '" data-path="' + H.esc(f.path || '') + '" aria-label="Download ' + H.esc(f.name) + '">' + I('download') + '</button>' +
            '<button class="bx-iconbtn" data-more="' + H.esc(f.name) + '" aria-label="More options for ' + H.esc(f.name) + '">' + I('chev') + '</button>' +
          '</div></div>';
      }).join('') + '</div>'
      : H.empty('file', 'No files in this folder', 'Try another folder, or drop something in above.')) +
      '</div>' +

      '<div class="bx-sec bx-card bx-card--pad">' +
        '<div class="bx-meter__h"><span class="bx-mono bx-meter__k">Storage used</span>' +
          '<span class="bx-meter__v">' + d.storage.usedGb + ' GB of ' + d.storage.totalGb + ' GB</span></div>' +
        '<div class="bx-bar"><div class="bx-bar__f" style="width:' + pct + '%"></div></div>' +
      '</div>';
    },
    mount: function (el) {
      el.querySelectorAll('#flFolders .bx-seg__b').forEach(function (b) {
        b.addEventListener('click', function () { fileFolder = b.getAttribute('data-f'); BIX.app.rerender(); });
      });
      var drop = el.querySelector('#flDrop');
      ['dragenter', 'dragover'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
      });
      var input = el.querySelector('#flInput');

      function send(list) {
        if (!list || !list.length) return;
        var files = [].slice.call(list);
        BIX.toast('Uploading ' + files.length + ' file' + (files.length === 1 ? '' : 's') + '…');
        Promise.all(files.map(function (f) { return BIX.api.uploadFile(f, fileFolder); }))
          .then(function (results) {
            var failed = results.filter(function (r) { return r && r.error; });
            return BIX.api.loadFor(BIX.api.viewingId).then(function () {
              BIX.app.rerender();
              BIX.toast(failed.length
                ? failed[0].error.message
                : 'Uploaded ' + files.length + ' file' + (files.length === 1 ? '' : 's'));
            });
          });
      }

      drop.addEventListener('drop', function (e) { send(e.dataTransfer && e.dataTransfer.files); });
      drop.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () { send(input.files); input.value = ''; });

      el.querySelectorAll('[data-dl]').forEach(function (b) {
        b.addEventListener('click', function () {
          var path = b.getAttribute('data-path');
          if (!path) { BIX.toast('This file has no stored copy yet'); return; }
          BIX.api.downloadFile(path).then(function (r) {
            if (r.error || !r.data) { BIX.toast(r.error ? r.error.message : 'Could not fetch that file'); return; }
            window.open(r.data.signedUrl, '_blank', 'noopener');
          });
        });
      });
      el.querySelectorAll('[data-more]').forEach(function (b) {
        b.addEventListener('click', function () {
          BIX.modal({
            title: b.getAttribute('data-more'),
            body: '<div class="bx-stack">' +
              '<button class="bx-btn bx-btn--ghost bx-btn--block" data-close>Rename</button>' +
              '<button class="bx-btn bx-btn--ghost bx-btn--block" data-close>Move to folder</button>' +
              '<button class="bx-btn bx-btn--ghost bx-btn--block" data-close>Share a link</button></div>',
            foot: '<button class="bx-btn bx-btn--danger" data-close>Delete file</button>'
          });
        });
      });
    }
  };

  /* =============================== INVOICES ============================== */
  BIX.views.invoices = {
    render: function () {
      var d = BIX.data, pm = d.paymentMethod;
      var due = d.invoices.filter(function (i) { return i.status !== 'Paid'; });

      return '' +
      '<div class="bx-card bx-payhero">' +
        '<div>' +
          '<div class="bx-mono bx-faint">Outstanding balance</div>' +
          '<div class="bx-big" style="margin-top:6px">' + H.money(d.outstanding) + '</div>' +
          '<div class="bx-mini__s" style="margin-top:5px">' +
            (due.length ? 'across ' + due.length + ' invoice' + (due.length === 1 ? '' : 's') : 'nothing due') + '</div>' +
          '<div style="display:flex;gap:9px;margin-top:16px;flex-wrap:wrap">' +
            (d.outstanding ? '<button class="bx-btn bx-btn--primary" id="invPay">Pay now</button>' : '') +
            '<button class="bx-btn bx-btn--ghost" data-go="subscription">Care plan</button>' +
          '</div>' +
          '<div class="bx-mono bx-faint" style="margin-top:14px">Next charge ' + H.date(d.client.nextBilling) + ' · ' + H.money(d.client.planPrice) + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="bx-mono bx-faint">Payment method</div>' +
          '<div style="display:flex;align-items:center;gap:12px;margin-top:12px">' +
            '<span class="bx-card__brand">' + H.esc(pm.brand) + '</span>' +
            '<div><div class="bx-mini__t">•••• ' + H.esc(pm.last4) + '</div>' +
            '<div class="bx-mini__s">Expires ' + H.esc(pm.exp) + '</div></div>' +
          '</div>' +
          '<button class="bx-btn bx-btn--ghost bx-btn--sm" id="invCard" style="margin-top:14px">Update</button>' +
        '</div>' +
      '</div>' +

      '<div class="bx-sec"><div class="bx-card">' +
        '<div class="bx-card__head"><h3>Invoices</h3></div>' +
        '<div class="bx-table__wrap"><table class="bx-table"><thead><tr>' +
          '<th scope="col">Number</th><th scope="col">Description</th>' +
          '<th scope="col" class="bx-drop-col">Issued</th><th scope="col" class="bx-drop-col">Due</th>' +
          '<th scope="col" class="bx-r">Amount</th><th scope="col">Status</th>' +
          '<th scope="col"><span class="bx-sr">Download</span></th></tr></thead><tbody>' +
          d.invoices.map(function (v) {
            return '<tr class="is-clickable' + (v.status === 'Overdue' ? ' is-overdue' : '') + '" data-open="' + H.esc(v.no) + '">' +
              '<td class="bx-num bx-faint">' + H.esc(v.no) + '</td>' +
              '<td class="bx-table__name">' + H.esc(v.desc) + '</td>' +
              '<td class="bx-drop-col bx-num bx-faint">' + H.date(v.issued) + '</td>' +
              '<td class="bx-drop-col bx-num bx-faint">' + H.date(v.due) + '</td>' +
              '<td class="bx-r">' + H.money(v.amount, 2) + '</td>' +
              '<td>' + H.pill(v.status) + '</td>' +
              '<td style="text-align:right"><button class="bx-iconbtn" data-inv="' + H.esc(v.no) + '" ' +
                'aria-label="Download ' + H.esc(v.no) + '">' + I('download') + '</button></td></tr>';
          }).join('') +
        '</tbody></table></div></div></div>' +

      '<div class="bx-sec"><div class="bx-card">' +
        '<div class="bx-card__head"><h3>Payment history</h3></div>' +
        '<div class="bx-card__body">' + d.payments.map(function (p) {
          return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(p.method) + '</div>' +
            '<div class="bx-mini__s">' + H.date(p.on) + ' · ' + H.esc(p.ref) + '</div></div>' +
            '<span class="bx-num" style="font-size:12.5px;font-weight:600">' + H.money(p.amount, 2) + '</span></div>';
        }).join('') + '</div></div></div>';
    },
    mount: function (el) {
      var pay = el.querySelector('#invPay');
      if (pay) pay.addEventListener('click', function () {
        var d = BIX.data;
        BIX.modal({
          title: 'Pay outstanding balance',
          body: '<p class="bx-hero__s">You are paying <b>' + H.money(d.outstanding, 2) + '</b> with ' +
                'Visa •••• ' + H.esc(d.paymentMethod.last4) + '.</p>' +
                '<div class="bx-stack" style="margin-top:14px">' +
                d.invoices.filter(function (i) { return i.status !== 'Paid'; }).map(function (i) {
                  return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(i.no) + '</div>' +
                    '<div class="bx-mini__s">' + H.esc(i.desc) + '</div></div>' +
                    '<span class="bx-num" style="font-weight:600">' + H.money(i.amount, 2) + '</span></div>';
                }).join('') + '</div>',
          foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
                '<button class="bx-btn bx-btn--primary" id="payGo">Pay ' + H.money(d.outstanding) + '</button>',
          mount: function (w) {
            w.querySelector('#payGo').addEventListener('click', function () {
              BIX.api.payAll().then(function (res) {
                if (res.error) { BIX.toast(res.error.message); return; }
                return BIX.api.loadFor(BIX.api.viewingId).then(function () {
                  BIX.closeModal();
                  BIX.app.rerender();
                  BIX.toast('Payment received — thank you');
                });
              });
            });
          }
        });
      });

      var upd = el.querySelector('#invCard');
      if (upd) upd.addEventListener('click', function () {
        BIX.modal({
          title: 'Update payment method',
          body: '<div class="bx-field"><label for="pmN">Card number</label><input id="pmN" placeholder="0000 0000 0000 0000" /></div>' +
                '<div class="bx-row2"><div class="bx-field"><label for="pmE">Expiry</label><input id="pmE" placeholder="MM / YY" /></div>' +
                '<div class="bx-field"><label for="pmC">CVC</label><input id="pmC" placeholder="123" /></div></div>' +
                '<p class="bx-field__hint bx-mono">Demo only — nothing is sent anywhere.</p>',
          foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
                '<button class="bx-btn bx-btn--primary" id="pmSave">Save card</button>',
          mount: function (w) {
            w.querySelector('#pmSave').addEventListener('click', function () {
              BIX.closeModal(); BIX.toast('Payment method updated');
            });
          }
        });
      });

      el.querySelectorAll('[data-inv]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          BIX.toast('Downloading ' + b.getAttribute('data-inv') + '.pdf');
        });
      });

      el.querySelectorAll('[data-open]').forEach(function (row) {
        row.addEventListener('click', function () { openInvoice(row.getAttribute('data-open')); });
      });
    }
  };

  function openInvoice(no) {
    var d = BIX.data;
    var v = d.invoices.filter(function (x) { return x.no === no; })[0];
    if (!v) return;

    BIX.modal({
      title: 'Invoice ' + v.no,
      body:
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
          '<div><div class="bx-mono bx-faint">Billed to</div>' +
            '<div class="bx-mini__t" style="margin-top:4px">' + H.esc(d.client.business) + '</div>' +
            '<div class="bx-mini__s">' + H.esc(d.client.address || '') + '</div></div>' +
          '<div style="text-align:right">' + H.pill(v.status) +
            '<div class="bx-big" style="margin-top:8px;font-size:26px">' + H.money(v.amount, 2) + '</div></div>' +
        '</div>' +

        '<div class="bx-dl" style="margin-top:18px">' +
          '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Description</span>' +
            '<span class="bx-dl__v">' + H.esc(v.desc) + '</span></div>' +
          '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Issued</span>' +
            '<span class="bx-dl__v">' + H.date(v.issued, 'long') + '</span></div>' +
          '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Due</span>' +
            '<span class="bx-dl__v">' + H.date(v.due, 'long') + '</span></div>' +
          '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Amount</span>' +
            '<span class="bx-dl__v">' + H.money(v.amount, 2) + '</span></div>' +
        '</div>' +

        (v.status === 'Paid'
          ? '<p class="bx-mini__s" style="margin-top:16px">Settled — thank you.</p>'
          : '<p class="bx-mini__s" style="margin-top:16px">Payable to Bix LLC · admin@bixllc.net</p>'),

      foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>' +
            '<button class="bx-btn bx-btn--ghost" id="invDl">Download PDF</button>' +
            (v.status !== 'Paid' ? '<button class="bx-btn bx-btn--primary" id="invPayOne">Pay ' + H.money(v.amount) + '</button>' : ''),

      mount: function (w) {
        w.querySelector('#invDl').addEventListener('click', function () {
          BIX.toast('Downloading ' + v.no + '.pdf');
        });
        var pay = w.querySelector('#invPayOne');
        if (pay) pay.addEventListener('click', function () {
          BIX.api.payAll().then(function (res) {
            if (res.error) { BIX.toast(res.error.message); return; }
            return BIX.api.loadFor(BIX.api.viewingId).then(function () {
              BIX.closeModal(); BIX.app.rerender(); BIX.toast('Payment received — thank you');
            });
          });
        });
      }
    });
  }

  /* =============================== MEETINGS ============================== */
  BIX.views.meetings = {
    render: function () {
      var d = BIX.data;
      var next = d.meetings.filter(function (m) { return m.upcoming; })[0];
      var past = d.meetings.filter(function (m) { return !m.upcoming; });

      return '' +
      (next
        ? '<div class="bx-card bx-hero">' +
            '<div class="bx-datebox" style="width:78px;padding:14px 0">' +
              '<div class="bx-datebox__d" style="font-size:30px">' + H.date(next.when, 'day') + '</div>' +
              '<div class="bx-datebox__m">' + H.date(next.when, 'mon') + '</div></div>' +
            '<div class="bx-hero__body">' +
              '<div class="bx-hero__t">' + H.esc(next.title) + '</div>' +
              '<div class="bx-hero__s">' + H.esc(next.time) + ' · ' + H.esc(next.dur) + ' · ' + H.esc(next.attendees.join(', ')) + '</div>' +
              '<div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap">' +
                '<a class="bx-btn bx-btn--primary" href="' + H.esc(next.link) + '" target="_blank" rel="noopener">Join call</a>' +
                '<button class="bx-btn bx-btn--ghost" data-resch="' + H.esc(next.id) + '">Reschedule</button>' +
                '<button class="bx-btn bx-btn--ghost" data-cancel="' + H.esc(next.id) + '">Cancel</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        : '<div class="bx-card bx-card--pad">' +
            H.empty('calendar', 'No meetings booked', 'Book a slot and it will show up here.',
              '<button class="bx-btn bx-btn--primary" id="mtBook2">Book a meeting</button>') + '</div>') +

      '<div class="bx-sec"><div class="bx-sec__h"><h2>Past meetings</h2>' +
        '<button class="bx-btn bx-btn--primary bx-btn--sm" id="mtBook">' + I('plus') + 'Book a meeting</button></div>' +
        '<div class="bx-card"><div class="bx-card__body">' +
          (past.length ? past.map(function (m) {
            return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(m.title) + '</div>' +
              '<div class="bx-mini__s">' + H.date(m.when) + ' · ' + H.esc(m.dur) + '</div></div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<button class="bx-seg__b" data-notes="' + H.esc(m.id) + '">Notes</button>' +
                '<button class="bx-seg__b" data-rec="' + H.esc(m.id) + '">Recording</button>' +
              '</div></div>';
          }).join('') : H.empty('calendar', 'No past meetings', 'Your call history will build up here.')) +
        '</div></div></div>';
    },
    mount: function (el) {
      ['mtBook', 'mtBook2'].forEach(function (id) {
        var b = el.querySelector('#' + id);
        if (b) b.addEventListener('click', bookModal);
      });
      el.querySelectorAll('[data-notes]').forEach(function (b) {
        b.addEventListener('click', function () {
          var m = BIX.data.meetings.filter(function (x) { return x.id === b.getAttribute('data-notes'); })[0];
          BIX.modal({
            title: m.title,
            body: '<div class="bx-mono bx-faint">' + H.date(m.when, 'long') + ' · ' + H.esc(m.dur) + '</div>' +
                  '<p class="bx-detail__d" style="margin-top:12px">' + H.esc(m.notes) + '</p>' +
                  '<div class="bx-mono bx-faint" style="margin-top:16px">Attendees</div>' +
                  '<p class="bx-mini__t" style="margin-top:5px">' + H.esc(m.attendees.join(', ')) + '</p>',
            foot: '<button class="bx-btn bx-btn--ghost" data-close>Close</button>'
          });
        });
      });
      el.querySelectorAll('[data-rec]').forEach(function (b) {
        b.addEventListener('click', function () { BIX.toast('Opening the recording'); });
      });
      el.querySelectorAll('[data-resch]').forEach(function (b) {
        b.addEventListener('click', bookModal);
      });
      el.querySelectorAll('[data-cancel]').forEach(function (b) {
        b.addEventListener('click', function () {
          BIX.modal({
            title: 'Cancel this meeting?',
            body: '<p class="bx-hero__s">We\'ll let your team know and free up the slot. You can rebook any time.</p>',
            foot: '<button class="bx-btn bx-btn--ghost" data-close>Keep it</button>' +
                  '<button class="bx-btn bx-btn--danger" id="mtKill">Cancel meeting</button>',
            mount: function (w) {
              w.querySelector('#mtKill').addEventListener('click', function () {
                var id = b.getAttribute('data-cancel');
                BIX.data.meetings = BIX.data.meetings.filter(function (m) { return m.id !== id; });
                BIX.closeModal(); BIX.app.rerender(); BIX.toast('Meeting cancelled');
              });
            }
          });
        });
      });
    }
  };

  var CALENDLY = 'https://calendly.com/bixllc/website-inquiry-call';

  function bookModal() {
    window.open(CALENDLY, '_blank', 'noopener');
    BIX.toast('Opening the booking calendar');
  }

  function bookModalOld() {
    var d = BIX.data;
    var days = [1, 2, 3, 4, 5].map(function (n) { return d.ahead(n); });
    var slots = ['09:00', '10:30', '13:00', '14:30', '16:00'];

    BIX.modal({
      title: 'Book a meeting',
      body:
        '<div class="bx-field"><label for="mkT">What\'s it about?</label>' +
          '<input id="mkT" placeholder="e.g. Loyalty flow walkthrough" /></div>' +
        '<div class="bx-field"><label id="mkDL">Day</label>' +
          '<div class="bx-seg" id="mkD" role="radiogroup" aria-labelledby="mkDL">' + days.map(function (dd, i) {
            return '<button type="button" class="bx-seg__b' + (i === 0 ? ' is-on' : '') + '" role="radio" ' +
              'aria-checked="' + (i === 0) + '" data-d="' + dd + '">' + H.date(dd) + '</button>';
          }).join('') + '</div></div>' +
        '<div class="bx-field"><label id="mkSL">Time</label>' +
          '<div class="bx-seg" id="mkS" role="radiogroup" aria-labelledby="mkSL">' + slots.map(function (s, i) {
            return '<button type="button" class="bx-seg__b' + (i === 1 ? ' is-on' : '') + '" role="radio" ' +
              'aria-checked="' + (i === 1) + '" data-s="' + s + '">' + s + '</button>';
          }).join('') + '</div></div>',
      foot: '<button class="bx-btn bx-btn--ghost" data-close>Cancel</button>' +
            '<button class="bx-btn bx-btn--primary" id="mkGo">Confirm booking</button>',
      mount: function (w) {
        var day = days[0], slot = slots[1];
        function wire(sel, set) {
          w.querySelectorAll(sel + ' .bx-seg__b').forEach(function (b) {
            b.addEventListener('click', function () {
              set(b);
              w.querySelectorAll(sel + ' .bx-seg__b').forEach(function (o) {
                var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-checked', String(on));
              });
            });
          });
        }
        wire('#mkD', function (b) { day = b.getAttribute('data-d'); });
        wire('#mkS', function (b) { slot = b.getAttribute('data-s'); });

        w.querySelector('#mkGo').addEventListener('click', function () {
          var t = w.querySelector('#mkT').value.trim() || 'Project check-in';
          BIX.data.meetings.unshift({
            id: 'M-' + (10 + BIX.data.meetings.length), title: t, when: day, time: slot,
            dur: '30 min', upcoming: true,
            attendees: [BIX.data.client.name, 'Sheneska Williams'],
            link: 'https://meet.google.com/bix-serene-new',
            notes: ''
          });
          BIX.closeModal(); BIX.app.rerender(); BIX.toast('Meeting booked for ' + H.date(day));
        });
      }
    });
  }

  /* =============================== WEBSITE =============================== */
  BIX.views.website = {
    wide: true,
    render: function () {
      var w = BIX.data.website;
      return '' +
      '<div class="bx-card bx-hero">' +
        BIX.ring(w.score, 'Health') +
        '<div class="bx-hero__body">' +
          '<div class="bx-hero__t">Your site is healthy</div>' +
          '<div class="bx-hero__s">Checked continuously. Last full backup ' + H.date(w.backup) + '.</div>' +
        '</div>' +
      '</div>' +

      '<div class="bx-sec bx-stats">' +
        stat('green', 'zap',    'Uptime',      w.uptime) +
        stat('blue',  'clock',  'Load time',   w.load) +
        stat('green', 'shield', 'SSL',         w.ssl,   '<div class="bx-stat__d">until ' + H.date(w.sslUntil) + '</div>') +
        stat('purple','folder', 'Last backup', H.date(w.backup)) +
      '</div>' +

      '<div class="bx-sec bx-split">' +
        '<div class="bx-card"><div class="bx-card__head"><h3>Live preview</h3>' +
          '<div class="bx-card__head-r"><a class="bx-btn bx-btn--ghost bx-btn--sm" href="https://' + H.esc(w.domain) + '" target="_blank" rel="noopener">Visit site →</a></div></div>' +
          '<div class="bx-card__body"><div class="bx-browser">' +
            '<div class="bx-browser__bar">' +
              '<span class="bx-browser__dot" style="background:#ff5f57"></span>' +
              '<span class="bx-browser__dot" style="background:#febc2e"></span>' +
              '<span class="bx-browser__dot" style="background:#28c840"></span>' +
              '<span class="bx-browser__url">' + H.esc(w.domain) + '</span></div>' +
            '<img class="bx-browser__shot" src="' + H.esc(w.shot) + '" alt="Screenshot of ' + H.esc(w.domain) + '" loading="lazy" />' +
          '</div></div></div>' +

        '<div class="bx-stack">' +
          '<div class="bx-card"><div class="bx-card__head"><h3>Hosting</h3></div>' +
            '<div class="bx-card__body"><div class="bx-dl">' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Plan</span><span class="bx-dl__v">' + H.esc(w.host) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Region</span><span class="bx-dl__v">' + H.esc(w.region) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Domain</span><span class="bx-dl__v">' + H.esc(w.domain) + '</span></div>' +
              '<div class="bx-dl__row"><span class="bx-mono bx-dl__k">Renews</span><span class="bx-dl__v">' + H.date(w.domainExpiry) + '</span></div>' +
            '</div></div></div>' +

          '<div class="bx-card"><div class="bx-card__head"><h3>Recent deploys</h3></div>' +
            '<div class="bx-card__body"><ul class="bx-feed">' + w.deploys.map(function (dp) {
              return '<li><div class="bx-feed__t"><b>' + H.esc(dp.what) + '</b></div>' +
                '<div class="bx-feed__w">' + H.date(dp.on) + ' · ' + H.esc(dp.by) + '</div></li>';
            }).join('') + '</ul></div></div>' +
        '</div>' +
      '</div>';
    },
    mount: function (el) { BIX.animateRing(el); }
  };

  /* ============================= SUBSCRIPTION ============================ */
  BIX.views.subscription = {
    wide: true,
    render: function () {
      var d = BIX.data;
      var cur = d.plans.filter(function (p) { return p.current; })[0];

      return '' +
      '<div class="bx-split--even bx-split">' +
        '<div class="bx-plan">' +
          '<div class="bx-plan__n">' + H.esc(cur.name) + '</div>' +
          '<div class="bx-plan__p">' + H.money(cur.price) + '</div>' +
          '<div class="bx-plan__c">per month · renews ' + H.date(d.client.nextBilling) + '</div>' +
          '<ul class="bx-plan__list">' + cur.items.map(function (i) {
            return '<li>' + I('check') + H.esc(i) + '</li>';
          }).join('') + '</ul>' +
        '</div>' +

        '<div class="bx-card bx-card--pad">' +
          '<h3 style="font-size:14px;font-weight:600;margin-bottom:16px">This month</h3>' +
          d.usage.map(function (u) {
            var pct = Math.min(100, Math.round(u.used / u.of * 100));
            return '<div class="bx-meter"><div class="bx-meter__h">' +
              '<span class="bx-mono bx-meter__k">' + H.esc(u.k) + '</span>' +
              '<span class="bx-meter__v">' + u.used + ' / ' + u.of + ' ' + H.esc(u.unit) + '</span></div>' +
              '<div class="bx-bar"><div class="bx-bar__f" style="width:' + pct + '%"></div></div></div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="bx-sec"><div class="bx-sec__h"><h2>Compare plans</h2></div>' +
        '<div class="bx-tiers">' + d.plans.map(function (p) {
          return '<div class="bx-tier' + (p.current ? ' is-current' : '') + '">' +
            (p.current ? '<span class="bx-tier__badge">Your plan</span>' : '') +
            '<div class="bx-tier__n">' + H.esc(p.name) + '</div>' +
            '<div class="bx-tier__p">' + H.money(p.price) + '<span class="bx-mono bx-faint" style="font-size:10.5px"> /mo</span></div>' +
            '<div class="bx-mini__s">' + H.esc(p.blurb) + '</div>' +
            '<ul class="bx-tier__l">' + p.items.map(function (i) {
              return '<li>' + I('check') + '<span>' + H.esc(i) + '</span></li>';
            }).join('') + '</ul>' +
            (p.current
              ? '<button class="bx-btn bx-btn--ghost bx-btn--block" style="margin-top:16px" disabled>Current plan</button>'
              : '<button class="bx-btn bx-btn--primary bx-btn--block" style="margin-top:16px" data-plan="' + H.esc(p.name) + '">Switch to ' + H.esc(p.name) + '</button>') +
          '</div>';
        }).join('') + '</div></div>' +

      '<div class="bx-sec bx-split">' +
        '<div class="bx-card"><div class="bx-card__head"><h3>Billing history</h3></div>' +
          '<div class="bx-card__body">' + d.payments.slice(0, 4).map(function (p) {
            return '<div class="bx-mini"><div><div class="bx-mini__t">' + H.esc(p.ref) + '</div>' +
              '<div class="bx-mini__s">' + H.date(p.on) + ' · ' + H.esc(p.method) + '</div></div>' +
              '<span class="bx-num" style="font-weight:600">' + H.money(p.amount, 2) + '</span></div>';
          }).join('') + '</div>' +
          '<div class="bx-card__foot"><button class="bx-btn bx-btn--ghost bx-btn--sm" data-go="invoices">All invoices</button></div></div>' +

        '<div class="bx-card bx-card--pad">' +
          '<h3 style="font-size:14px;font-weight:600">Need to pause or cancel?</h3>' +
          '<p class="bx-mini__s" style="margin-top:7px;line-height:1.6">Things change. Talk to us before your next ' +
            'renewal and we\'ll sort out a pause, a downgrade, or a clean handover — no lock-in either way.</p>' +
          '<button class="bx-btn bx-btn--ghost" style="margin-top:14px" data-go="support">Talk to support</button>' +
        '</div>' +
      '</div>';
    },
    mount: function (el) {
      el.querySelectorAll('[data-plan]').forEach(function (b) {
        b.addEventListener('click', function () {
          var name = b.getAttribute('data-plan');
          BIX.modal({
            title: 'Switch to ' + name + '?',
            body: '<p class="bx-hero__s">The change takes effect on your next renewal, ' +
                  H.date(BIX.data.client.nextBilling) + '. Nothing is charged today.</p>',
            foot: '<button class="bx-btn bx-btn--ghost" data-close>Not now</button>' +
                  '<button class="bx-btn bx-btn--primary" id="plGo">Confirm switch</button>',
            mount: function (w) {
              w.querySelector('#plGo').addEventListener('click', function () {
                var d = BIX.data;
                d.plans.forEach(function (p) { p.current = p.name === name; });
                var np = d.plans.filter(function (p) { return p.current; })[0];
                d.client.plan = np.name;
                d.client.planPrice = np.price;
                document.getElementById('bxSidePlan').textContent = np.name;
                document.getElementById('bxPlanCard').querySelector('.bx-plancard__v').textContent = np.name;
                BIX.closeModal(); BIX.app.rerender(); BIX.toast('Switched to ' + name);
              });
            }
          });
        });
      });
    }
  };
})();
