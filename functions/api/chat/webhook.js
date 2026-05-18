// POST /api/chat/webhook
//
// Telegram webhook handler. The bot is configured to POST every update here.
// We accept dispatcher messages from the configured group only, look up the
// owning session by message_thread_id, append to KV. The widget picks up the
// reply on its next /poll cycle.
//
// Webhook registration (run once, from a machine that has the bot token):
//   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook \
//        ?url=https://samedayappliance.repair/api/chat/webhook \
//        &allowed_updates=[\"message\"]"

export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    if (!update || !update.message) return new Response('ok');

    const msg = update.message;
    const chatId = String(msg.chat && msg.chat.id);
    const expectedChatId = String(env.CHAT_TG_GROUP_ID);
    if (chatId !== expectedChatId) return new Response('ignored');

    const topicId = msg.message_thread_id;
    if (!topicId) return new Response('no_topic');

    if (msg.from && msg.from.is_bot) return new Response('bot_msg');

    const text = msg.text || msg.caption || '';
    if (!text.trim()) return new Response('empty');

    const session = await findSessionByTopicId(env, topicId);
    if (!session) return new Response('session_not_found');

    session.last_index = (session.last_index || 0) + 1;
    session.messages.push({
      from: 'dispatcher',
      text,
      ts: Date.now(),
      index: session.last_index
    });

    await env.SDAR_CHAT.put(`session:${session.session_id}`, JSON.stringify(session), {
      expirationTtl: 7 * 24 * 60 * 60
    });

    return new Response('ok');
  } catch (err) {
    return new Response('error: ' + String(err), { status: 500 });
  }
}

// Linear scan over session: keys. Fine for the dispatcher volume we expect
// (dozens to low-hundreds of active sessions). If load grows, maintain a
// reverse index key topic:<id> → session_id.
async function findSessionByTopicId(env, topicId) {
  let cursor = undefined;
  while (true) {
    const list = await env.SDAR_CHAT.list({ prefix: 'session:', cursor });
    for (const key of list.keys) {
      const session = await env.SDAR_CHAT.get(key.name, 'json');
      if (session && session.topic_id === topicId) {
        return session;
      }
    }
    if (list.list_complete) return null;
    cursor = list.cursor;
  }
}
