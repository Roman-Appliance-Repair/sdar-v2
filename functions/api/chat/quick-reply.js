// POST /api/chat/quick-reply
//
// Canned button responses. The widget surfaces three: service-call price,
// repair-cost ballpark, today availability. We send the auto-reply HTML back
// to the widget AND mirror the exchange into the session log (so the
// dispatcher sees in Telegram what the user already received).
//
// Cloudflare Pages Functions cannot import from src/ — the working-hours
// helper is duplicated here verbatim from src/data/chat-config.ts. If the
// canonical hours change, update both.

const WORKING_HOURS = { start: 6, end: 22, timezone: 'America/Los_Angeles' };

function isWorkingHours(date = new Date()) {
  const laTime = new Date(date.toLocaleString('en-US', { timeZone: WORKING_HOURS.timezone }));
  const hour = laTime.getHours();
  return hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end;
}

const QUICK_REPLY_QUESTIONS = {
  service_call: 'How much is the service call?',
  repair_cost:  'How much will the repair cost?',
  availability: 'Can you come today?'
};

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { session_id, quick_reply_id, page_path } = body || {};

    if (!session_id || !quick_reply_id || !QUICK_REPLY_QUESTIONS[quick_reply_id]) {
      return json({ error: 'invalid' }, 400);
    }

    const isCommercial = typeof page_path === 'string' && page_path.startsWith('/commercial/');
    const workingNow = isWorkingHours();

    let reply = '';
    const userQuestion = QUICK_REPLY_QUESTIONS[quick_reply_id];

    if (quick_reply_id === 'service_call') {
      if (isCommercial) {
        reply = `Our diagnostic fee for commercial equipment is <strong>$120</strong>. The fee is <strong>waived when you approve the repair</strong> — you only pay for the repair itself.<br><br>Anything else I can help with?`;
      } else if (page_path === '/' || page_path === '') {
        reply = `Our diagnostic fee:<br>• <strong>$89</strong> for residential appliances<br>• <strong>$120</strong> for commercial equipment<br><br>The fee is <strong>waived when you approve the repair</strong>.<br><br>Anything else I can help with?`;
      } else {
        reply = `Our diagnostic fee is <strong>$89</strong> for residential appliances. The fee is <strong>waived when you approve the repair</strong> — you only pay for the repair itself.<br><br>Anything else I can help with?`;
      }
    } else if (quick_reply_id === 'repair_cost') {
      const aiDiagUrl = `/ai-diagnostic/?ref=chat${page_path ? '&from=' + encodeURIComponent(page_path) : ''}`;
      reply = `We track pricing across all our repairs and can give you a realistic ballpark right now based on our data — but the final price is only confirmed on-site after our technician diagnoses your unit.<br><br>Try our AI Diagnostic tool — answer a few questions about what’s happening and you’ll see the average cost for that exact repair:<br><br><a href="${aiDiagUrl}" target="_blank">✨ Open AI Diagnostic →</a><br><br>Or describe what’s wrong below and our dispatcher will help.`;
    } else if (quick_reply_id === 'availability') {
      if (workingNow) {
        reply = `Yes — during our working hours (Mon-Sat 6am-10pm) our technician is typically at your location within <strong>1.5-2 hours</strong> of your call. Sometimes faster depending on routing.<br><br>To lock in a slot, describe your unit and issue below — our dispatcher will check the schedule and confirm a time.<br><br><a href="/book/?ref=chat" target="_blank">📅 Book online →</a>`;
      } else {
        reply = `We’re outside regular dispatch hours right now. Three ways to move forward:<br><br>1️⃣ <strong>Describe your problem below</strong> — the first available dispatcher will respond with all the info you need.<br><br>2️⃣ <a href="/ai-diagnostic/?ref=chat" target="_blank">✨ Try AI Diagnostic</a> — get a price estimate and likely cause of the issue right now.<br><br>3️⃣ <a href="/book/?ref=chat" target="_blank">📅 Book online</a> — reserve a slot for our next available window.`;
      }
    }

    const sessionKey = `session:${session_id}`;
    let session = await env.SDAR_CHAT.get(sessionKey, 'json');
    if (session) {
      session.last_index = (session.last_index || 0) + 1;
      session.messages.push({
        from: 'user',
        text: `[Quick reply] ${userQuestion}`,
        ts: Date.now(),
        index: session.last_index
      });
      session.last_index += 1;
      session.messages.push({
        from: 'bot',
        text: reply,
        ts: Date.now(),
        index: session.last_index
      });
      await env.SDAR_CHAT.put(sessionKey, JSON.stringify(session), { expirationTtl: 7 * 24 * 60 * 60 });

      const tgText = `🤖 <b>User used quick-reply:</b> ${escapeHtml(userQuestion)}\n\n<b>Auto-reply sent:</b>\n${stripHtml(reply)}`;
      await fetch(`https://api.telegram.org/bot${env.CHAT_TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.CHAT_TG_GROUP_ID,
          message_thread_id: session.topic_id,
          text: tgText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
    }

    return json({ reply_html: reply });
  } catch (err) {
    return json({ error: 'server', detail: String(err) }, 500);
  }
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
