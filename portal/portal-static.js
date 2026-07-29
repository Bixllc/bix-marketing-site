/* ==========================================================================
   BIX.staticContent — product copy that is the same for every client.
   FAQs, tutorials, plan tiers and usage labels are not client records, so
   they live here rather than in the database.
   ========================================================================== */
window.BIX = window.BIX || {};

window.BIX.staticContent = {
  faqs: [
    { q: 'How do I block off a day for holidays?',
      a: 'Open the staff calendar, tap the day, and choose “Block day”. Anything already booked stays put — you\'ll be asked whether to notify those clients.' },
    { q: 'What happens when a client cancels late?',
      a: 'Inside 48 hours the deposit is forfeited automatically and the slot reopens for booking. You can override it manually from the booking record if you want to be generous.' },
    { q: 'How do I add a new service?',
      a: 'Services live under Admin → Service menu. Add the name, duration, price and whether it needs a consultation form, and it appears in booking immediately.' },
    { q: 'Can I message clients directly from the portal?', a: 'Yes — open a client record and use the message panel.', needs: 'messages' },
    { q: 'How do I top up SMS credits?',
      a: 'Raise a ticket and we\'ll add credits the same day, then invoice them on your next retainer. A 2,000-credit top-up runs $95.' },
    { q: 'Who owns the site and the content?',
      a: 'You do — outright. Everything is documented in your build agreement under Files → Contracts.' },
    { q: 'Can Bix\'s AI assistant answer client questions for me?', a: 'The assistant can draft replies from your service menu.', needs: 'ai' }
  ],

  tutorials: [
    { title: 'Taking a booking over the phone',   dur: '3:20' },
    { title: 'Editing your service menu',         dur: '4:45' },
    { title: 'Refunding or releasing a deposit',  dur: '2:38' },
    { title: 'Reading your monthly report',       dur: '5:12' },
    { title: 'Blocking time off for the team',    dur: '2:05' },
    { title: 'Chatting with the AI assistant',    dur: '3:44', needs: 'ai' },
    { title: 'Booking a meeting with your lead',  dur: '1:52', needs: 'booking' }
  ],

  plans: [
    { name: 'Essential Care', price: 180, blurb: 'Keep the lights on',
      items: ['2 change requests / month', 'Hosting & backups', '48-hour response', 'Uptime monitoring'] },
    { name: 'Growth Care', price: 340, blurb: 'Keep improving', current: true,
      items: ['6 change requests / month', 'Hosting & backups', '24-hour response', 'Monthly performance report', 'Quarterly strategy call'] },
    { name: 'Partner Care', price: 720, blurb: 'Treat us as your team',
      items: ['Unlimited change requests', 'Hosting & backups', 'Same-day response', 'Monthly strategy call', 'Priority build slots'] }
  ],

  usage: [
    { k: 'Change requests', used: 4,  of: 6,  unit: 'this month' },
    { k: 'Support response', used: 6, of: 24, unit: 'hour average', invert: true },
    { k: 'Hours logged',     used: 11, of: 16, unit: 'this month' }
  ]
};
