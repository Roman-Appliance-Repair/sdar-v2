// POST /api/chat/webhook
//
// Telegram webhook. The dispatcher answers a client by REPLYING (swipe-reply)
// to any message the bot posted for that session — the lead card or any relayed
// client message. We resolve the reply target through the KV message index, so
// there is no scanning and no forum topics involved.
//
// Anything else in the group — a reply to a human, a reply to a message from
// another session that has expired, plain chatter — is ignored on purpose.
//
// Registration is done once via POST /api/chat/admin {op:"setwebhook"}.

import { json, groupId, tg, getSession, putSession, appendMessage } from './_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const update = await request.json();
    const msg = update && update.message;
    if (!msg) return new Response('ok');

    if (String(msg.chat && msg.chat.id) !== groupId(env)) return new Response('ignored');
    if (msg.from && msg.from.is_bot) return new Response('bot_msg');

    const replyTo = msg.reply_to_message;
    if (!replyTo) return new Response('not_a_reply');

    // Only replies to OUR OWN messages count. A dispatcher replying to a
    // colleague must not leak into a client's chat window.
    if (!replyTo.from || !replyTo.from.is_bot) return new Response('reply_to_human');

    const sessionId = await env.SDAR_CHAT.get(`msg:${replyTo.message_id}`);
    if (!sessionId) return new Response('unknown_message');

    const text = (msg.text || msg.caption || '').trim();
    if (!text) return new Response('empty');

    const session = await getSession(env, sessionId);
    if (!session) return new Response('session_not_found');

    appendMessage(session, 'dispatcher', text);
    await putSession(env, session);

    // ✅ on the dispatcher's own message = "delivered to the site".
    await tg(env, 'setMessageReaction', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reaction: [{ type: 'emoji', emoji: '✅' }]
    });

    return new Response('ok');
  } catch (err) {
    return new Response('error: ' + String(err), { status: 500 });
  }
}

// Telegram only ever POSTs here. A GET is almost always a human checking the
// URL by hand — answer plainly instead of a 405 from the router.
export async function onRequestGet() {
  return json({ ok: true, hint: 'Telegram webhook endpoint — POST only' });
}
