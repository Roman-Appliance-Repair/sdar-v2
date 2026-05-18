// POST /api/chat/send
//
// Receive a user message from the chat widget, create (or reuse) a Telegram
// forum topic in the dispatcher group, forward the message, and append it to
// the KV-backed session log so subsequent /poll requests return history.
//
// Env bindings expected:
//   CHAT_TG_BOT_TOKEN        Telegram bot token
//   CHAT_TG_GROUP_ID         Supergroup-with-topics chat ID
//   SDAR_CHAT                KV namespace (sessions)

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { session_id, message, page_url, page_path, referrer, user_agent } = body || {};

    if (!session_id || typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return json({ error: 'invalid' }, 400);
    }

    const ipCity    = request.headers.get('CF-IPCity')       || 'unknown';
    const ipPostal  = request.headers.get('CF-IPPostalCode') || '';
    const ipRegion  = request.headers.get('CF-IPRegion')     || '';
    const ipCountry = request.headers.get('CF-IPCountry')    || '';

    const sessionKey = `session:${session_id}`;
    let session = await env.SDAR_CHAT.get(sessionKey, 'json');

    if (!session) {
      const topicName = `${ipCity || 'unknown'} · ${ipPostal || '?'} · ${String(session_id).slice(-6)}`;
      const topicRes = await fetch(`https://api.telegram.org/bot${env.CHAT_TG_BOT_TOKEN}/createForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.CHAT_TG_GROUP_ID,
          name: topicName,
          icon_color: 7322096
        })
      });
      const topicData = await topicRes.json();
      if (!topicData.ok) {
        return json({ error: 'topic_failed', detail: topicData }, 500);
      }

      const topicId = topicData.result.message_thread_id;
      session = {
        session_id,
        topic_id: topicId,
        created_at: Date.now(),
        page_path: page_path || '',
        messages: [],
        last_index: 0
      };

      const contextMsg = formatContextMessage({
        page_url, page_path, referrer, user_agent,
        ipCity, ipPostal, ipRegion, ipCountry,
        session_id
      });
      await sendTelegramMessage(env, topicId, contextMsg, 'HTML');
    }

    session.last_index = (session.last_index || 0) + 1;
    session.messages.push({
      from: 'user',
      text: message,
      ts: Date.now(),
      index: session.last_index
    });

    await env.SDAR_CHAT.put(sessionKey, JSON.stringify(session), { expirationTtl: 7 * 24 * 60 * 60 });

    await sendTelegramMessage(env, session.topic_id, `💬 <b>User:</b>\n${escapeHtml(message)}`, 'HTML');

    return json({ ok: true, index: session.last_index });
  } catch (err) {
    return json({ error: 'server', detail: String(err) }, 500);
  }
}

function formatContextMessage(ctx) {
  const device = ctx.user_agent && /Mobile|Android|iPhone/i.test(ctx.user_agent) ? 'Mobile' : 'Desktop';
  return [
    `📋 <b>New Chat Session</b>`,
    ``,
    `🗺️ Page: <code>${escapeHtml(ctx.page_path || '/')}</code>`,
    `📍 IP location: ${escapeHtml(ctx.ipCity)}, ${escapeHtml(ctx.ipRegion)} ${escapeHtml(ctx.ipPostal)}`.trim(),
    `🌐 Referrer: ${escapeHtml(ctx.referrer || 'direct')}`,
    `📱 Device: ${device}`,
    `🆔 Session: <code>${escapeHtml(ctx.session_id)}</code>`,
    ``,
    `<i>Reply in this topic to respond to the user.</i>`
  ].join('\n');
}

async function sendTelegramMessage(env, topicId, text, parseMode = 'HTML') {
  return fetch(`https://api.telegram.org/bot${env.CHAT_TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.CHAT_TG_GROUP_ID,
      message_thread_id: topicId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true
    })
  });
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
