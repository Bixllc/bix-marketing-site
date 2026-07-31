/* ==========================================================================
   BIX.api — loads the portal's data from Supabase.

   It builds the exact same BIX.data shape the mock file produced, so every
   view keeps rendering unchanged. Swapping the source is the whole job.

   Admin: sees every client and can switch between them (BIX.api.viewingId).
   Client: locked to their own id — enforced by RLS, not by this file.
   ========================================================================== */
window.BIX = window.BIX || {};

(function () {
  'use strict';

  var sb = BixAuth.sb;

  function iso(d) { return d ? String(d).slice(0, 10) : null; }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* Relative time for the activity feed. */
  function since(ts) {
    var s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60);      if (m < 60) return m + ' minute' + (m === 1 ? '' : 's') + ' ago';
    var h = Math.floor(m / 60);      if (h < 24) return h + ' hour' + (h === 1 ? '' : 's') + ' ago';
    var d = Math.floor(h / 24);      if (d < 30) return d + ' day' + (d === 1 ? '' : 's') + ' ago';
    var mo = Math.floor(d / 30);     return mo + ' month' + (mo === 1 ? '' : 's') + ' ago';
  }

  /* projects.status is a constrained vocabulary in the database. Map it to the
     label the pills expect — H.tone() then colours it correctly. */
  /* The board vocabulary in one place. `phase` is a free-text column that is
     often unset, so the authoritative source is `status`. */
  var STATUS_PHASE = {
    discovery: 'Discovery', design: 'Design', development: 'Build',
    review: 'QA', launched: 'Launched'
  };

  var STATUS_LABEL = {
    discovery:   'Discovery',
    design:      'Design',
    development: 'In progress',
    review:      'Review',
    launched:    'Live'
  };

  function kindOf(name) {
    var e = String(name).split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','gif','webp','svg'].indexOf(e) > -1) return 'img';
    if (['mp4','mov','webm'].indexOf(e) > -1) return 'mp4';
    if (['xls','xlsx','csv'].indexOf(e) > -1) return 'xls';
    if (e === 'pdf') return 'pdf';
    return 'doc';
  }

  function sizeLabel(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function initialsOf(name) {
    return String(name || '?').trim().split(/\s+/).map(function (w) { return w[0]; })
      .join('').slice(0, 2).toUpperCase();
  }

  /* One round trip per table. Errors resolve to [] so a single missing table
     degrades that section to its empty state instead of blanking the portal. */
  function table(name, build) {
    return build.then(function (r) {
      if (r.error) { console.warn('[portal] ' + name + ':', r.error.message); return []; }
      return r.data || [];
    });
  }

  var api = {
    me: null,          // the signed-in profile
    viewingId: null,   // whose portal is on screen (admin can change this)
    clients: [],       // admin only

    isAdmin: function () { return api.me && api.me.role === 'admin'; },

    /* ---------------------------------------------------------------- boot */
    load: function (clientId) {
      return sb.auth.getSession().then(function (s) {
        var session = s.data && s.data.session;
        if (!session) { location.href = '../login.html'; return Promise.reject('no session'); }

        return sb.from('profiles').select('*').eq('id', session.user.id).single()
          .then(function (r) {
            if (r.error || !r.data) throw new Error('Could not load your profile.');
            api.me = r.data;
            api.me.email = api.me.email || session.user.email;

            if (api.isAdmin()) {
              return sb.from('profiles').select('*').eq('role', 'client')
                .order('business', { ascending: true })
                .then(function (c) {
                  api.clients = c.data || [];
                  api.viewingId = clientId || (api.clients[0] && api.clients[0].id) || api.me.id;
                  return api.viewingId;
                });
            }
            api.viewingId = api.me.id;
            return api.viewingId;
          });
      }).then(function (id) {
        return api.loadFor(id);
      });
    },

    /* ------------------------------------------------------------ the data */
    loadFor: function (clientId) {
      api.viewingId = clientId;

      return Promise.all([
        sb.from('profiles').select('*').eq('id', clientId).single(),
        sb.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        table('requests', sb.from('requests').select('*, request_comments(*)').eq('client_id', clientId).order('created_at', { ascending: false })),
        table('invoices', sb.from('invoices').select('*').eq('client_id', clientId).order('issued', { ascending: false })),
        table('payments', sb.from('payments').select('*').eq('client_id', clientId).order('paid_on', { ascending: false })),
        table('files',    sb.from('files').select('*').eq('client_id', clientId).order('created_at', { ascending: false })),
        table('meetings', sb.from('meetings').select('*').eq('client_id', clientId).order('meets_on', { ascending: false })),
        table('activity', sb.from('activity').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(12)),
        table('tickets',  sb.from('tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false }))
      ]).then(function (res) {
        var prof = res[0].data || {};
        var projects = res[1].data || [];
        var project = projects[0] || null;

        return (project
          ? table('phases', sb.from('phases').select('*').eq('project_id', project.id).order('position'))
          : Promise.resolve([])
        ).then(function (phases) {
          BIX.data = shape(prof, project, phases, res[2], res[3], res[4], res[5], res[6], res[7], res[8]);
          return BIX.data;
        });
      });
    },

    /* -------------------------------------------------------------- writes */
    addRequest: function (fields) {
      return sb.from('requests').insert({
        client_id: api.viewingId,
        ref: 'REQ-' + String(Date.now()).slice(-4),
        title: fields.title,
        category: fields.category,
        priority: fields.priority,
        status: 'Open',
        body: fields.body
      }).select().single();
    },

    addTicket: function (subject) {
      return sb.from('tickets').insert({
        client_id: api.viewingId,
        ref: 'TK-' + String(Date.now()).slice(-3),
        subject: subject,
        status: 'Open'
      }).select().single();
    },

    updateRequest: function (id, fields) {
      return sb.from('requests').update(fields).eq('id', id).select().single();
    },

    deleteRequest: function (id) {
      return sb.from('requests').delete().eq('id', id);
    },

    /* ---- files: Supabase Storage ---- */
    uploadFile: function (file, folder) {
      var path = api.viewingId + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]/g, '_');
      return sb.storage.from('client-files').upload(path, file).then(function (up) {
        if (up.error) return { error: up.error };
        return sb.from('files').insert({
          client_id: api.viewingId,
          name: file.name,
          kind: kindOf(file.name),
          size_label: sizeLabel(file.size),
          folder: folder && folder !== 'All' ? folder : 'General',
          url: path
        }).select().single();
      });
    },

    /* `download` makes Storage return Content-Disposition: attachment, so the
       browser saves the file instead of rendering PDFs and images inline. The
       value becomes the suggested filename. */
    downloadFile: function (path, name) {
      return sb.storage.from('client-files')
        .createSignedUrl(path, 60, { download: name || true });
    },

    /* Same signed URL without the attachment header, so the browser renders it
       in the preview modal rather than saving it. Longer TTL because a preview
       stays open while someone reads it. */
    previewFile: function (path) {
      return sb.storage.from('client-files').createSignedUrl(path, 300);
    },

    renameFile: function (id, name) {
      return sb.from('files').update({ name: name, kind: kindOf(name) })
        .eq('id', id).select().single();
    },

    /* Object first, then the row. If the object delete fails the row survives,
       which leaves a broken link rather than an orphaned file nobody can see. */
    deleteFile: function (id, path) {
      var obj = path
        ? sb.storage.from('client-files').remove([path])
        : Promise.resolve({ error: null });
      return obj.then(function (r) {
        if (r && r.error) return { error: r.error };
        return sb.from('files').delete().eq('id', id);
      });
    },



    saveProfile: function (patch) {
      return sb.from('profiles').update(patch).eq('id', api.viewingId).select().single();
    }
  };

  /* ---------------------------------------------------------------- shape */
  /* Everything below exists to hand the views the structure they already
     expect. Empty tables produce empty arrays, and every view has an empty
     state, so a fresh account renders rather than breaks. */
  function shape(prof, project, phases, requests, invoices, payments, files, meetings, activity, tickets) {
    /* The live address comes from the project first, then the client record.
       Both are optional, so every consumer must tolerate an empty string. */
    var url = (project && project.live_url) || prof.website || '';
    var domain = String(url).replace(/^https?:\/\//, '').replace(/\/$/, '');

    var name = prof.full_name || 'there';

    var d = {
      client: {
        firstName: name.split(' ')[0],
        name: name,
        business: prof.business || prof.company || name,
        email: prof.email || '',
        phone: prof.phone || '',
        initials: initialsOf(name),
        plan: prof.plan || 'Growth Care',
        planPrice: Number(prof.plan_price || 340),
        nextBilling: iso(prof.next_billing) || today(),
        industry: prof.industry || '',
        address: prof.address || '',
        timezone: prof.timezone || 'America/Jamaica'
      },

      project: project ? {
        name: project.name,
        url: project.live_url || '',
        status: STATUS_LABEL[project.status] || project.status || 'In progress',
        phase: STATUS_PHASE[project.status] || project.phase || 'Discovery',
        nextMilestone: project.next_milestone || 'To be scheduled',
        launched: iso(project.launched) || iso(project.start_date) || today(),
        stack: project.stack || '—',
        lastUpdated: iso(project.last_updated) || today(),
        progress: Number(project.progress || 0),
        summary: project.summary || project.description || ''
      } : {
        name: 'No project yet', url: '', status: 'Pending', phase: '—',
        nextMilestone: 'Your project will appear here once it kicks off.',
        launched: today(), stack: '—', lastUpdated: today(), progress: 0,
        summary: 'Once your project is set up it will show here.'
      },

      phases: phases.map(function (p) {
        return { name: p.name, state: p.state, note: p.note || '' };
      }),

      deliverables: [],
      team: [],

      requests: requests.map(function (r) {
        return {
          dbId: r.id,
          id: r.ref || r.id.slice(0, 8),
          title: r.title,
          category: r.category,
          priority: r.priority,
          status: r.status,
          date: iso(r.created_at),
          desc: r.body || 'No further detail provided.',
          comments: (r.request_comments || []).map(function (c) {
            return { who: c.author, w: since(c.created_at), t: c.body };
          })
        };
      }),

      invoices: invoices.map(function (i) {
        return {
          no: i.number, desc: i.descr || '', issued: iso(i.issued), due: iso(i.due),
          amount: Number(i.amount), status: i.status
        };
      }),

      payments: payments.map(function (p) {
        return { on: iso(p.paid_on), method: p.method || 'Card', amount: Number(p.amount), ref: p.invoice_no || '' };
      }),

      /* Invoices are settled by Zelle, so there is no stored card. */
      payTo: { method: 'Zelle', handle: 'admin@bixllc.net' },

      files: files.map(function (f) {
        return {
          name: f.name, kind: f.kind || 'doc', size: f.size_label || '',
          date: iso(f.created_at), folder: f.folder || 'General',
          src: null, path: f.url || null, id: f.id
        };
      }),

      storage: { usedGb: Number(prof.storage_used || 0), totalGb: 10 },

      meetings: meetings.map(function (m) {
        return {
          id: m.id, title: m.title, when: iso(m.meets_on), time: m.meets_at || '—',
          dur: m.duration || '30 min', upcoming: !!m.upcoming,
          attendees: m.attendees || [], link: m.link || '#', notes: m.notes || ''
        };
      }),

      activity: activity.map(function (a) {
        return { who: a.actor, what: a.action, w: since(a.created_at) };
      }),

      website: {
        /* A live render of the actual page, not a stored image, so it stays
           current as the site changes. thum.io needs no key; microlink is the
           fallback the view swaps to if thum.io fails to load. (WordPress
           mShots was the first choice and returns 403 to server callers.) */
        shot: 'https://image.thum.io/get/width/1200/crop/900/' + (url || ('https://' + domain)),
        shotAlt: 'https://api.microlink.io/?url=' + encodeURIComponent(url || ('https://' + domain)) +
                 '&screenshot=true&meta=false&embed=screenshot.url',
        url: url,
        domain: domain,
        host: prof.plan_includes || prof.plan || 'Bix managed hosting'
      },

      analytics: {
        visitors: [], leads: [], sources: [], topPages: [], revenue: 0,
        deltas: { visitors: 0, leads: 0, conv: 0, revenue: 0 }
      },

      tickets: tickets.map(function (t) {
        return { id: t.ref || t.id.slice(0, 6), subject: t.subject, opened: iso(t.created_at), status: t.status };
      }),

      faqs: BIX.staticContent.faqs,
      tutorials: BIX.staticContent.tutorials,
      notifications: [],
      plans: BIX.staticContent.plans,
      usage: BIX.staticContent.usage,

      today: today(),
      ago: function (n) { return iso(new Date(Date.now() - n * 86400000)); },
      ahead: function (n) { return iso(new Date(Date.now() + n * 86400000)); },

      recount: function () {
        BIX.data.outstanding = BIX.data.invoices
          .filter(function (i) { return i.status !== 'Paid'; })
          .reduce(function (s, i) { return s + i.amount; }, 0);
      },
      countRequests: function (status) {
        return BIX.data.requests.filter(function (r) { return r.status === status; }).length;
      }
    };

    d.outstanding = d.invoices
      .filter(function (i) { return i.status !== 'Paid'; })
      .reduce(function (s, i) { return s + i.amount; }, 0);

    /* Notifications are derived rather than stored — an overdue invoice and an
       imminent meeting are the two things worth surfacing. */
    d.invoices.forEach(function (i) {
      if (i.status === 'Overdue') d.notifications.push({ t: i.no + ' is overdue', w: 'due ' + i.due, kind: 'red' });
    });
    var next = d.meetings.filter(function (m) { return m.upcoming; })[0];
    if (next) d.notifications.push({ t: next.title, w: next.when, kind: 'purple' });

    return d;
  }

  BIX.api = api;
})();
