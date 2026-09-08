// POST /api/chat/admin
//
// One-off operations that need the bot token, which only exists inside the
// function. Guarded by CHAT_ADMIN_TOKEN (header `x-chat-admin-token`) — without
// it this endpoint would let anyone repoint the bot's webhook.
//
// Ops:
//   {"op":"getme"}        which bot the token belongs to
//   {"op":"chatinfo"}     can the bot see TG_GROUP_ID, and is it a forum
//   {"op":"webhookinfo"}  current webhook registration
//   {"op":"setwebhook"}   register this deployment's /api/chat/webhook.
//                         DO NOT run this against @sdar_dispatch_bot: CUP
//                         long-polls that token from Railway, and a webhook
//                         takes the updates away from it (dispatcher buttons,
//                         /register, availability polls). CUP forwards the
//                         updates to /api/chat/webhook itself instead. Kept
//                         only for the day the site chat gets its own bot.
//   {"op":"deletewebhook"}

import { json, tg, groupId } from './_shared.js';

export async function onRequestPost({ request, env }) {
  if (!env.CHAT_ADMIN_TOKEN) return json({ error: 'admin_disabled' }, 503);
  if (request.headers.get('x-chat-admin-token') !== env.CHAT_ADMIN_TOKEN) {
    return json({ error: 'forbidden' }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const op = body && body.op;
  const origin = new URL(request.url).origin;

  if (op === 'getme') {
    const me = await tg(env, 'getMe', {});
    return json({
      ok: me.ok,
      username: me.ok ? me.result.username : null,
      id: me.ok ? me.result.id : null,
      description: me.description || null,
      group_id_set: Boolean(groupId(env)),
      owner_id_set: Boolean(env.TG_OWNER_ID),
      kv_bound: Boolean(env.SDAR_CHAT)
    });
  }

  if (op === 'chatinfo') {
    const chat = await tg(env, 'getChat', { chat_id: groupId(env) });
    return json({
      ok: chat.ok,
      title: chat.ok ? chat.result.title : null,
      type: chat.ok ? chat.result.type : null,
      is_forum: chat.ok ? Boolean(chat.result.is_forum) : null,
      description: chat.description || null
    });
  }

  // Which SDAR_CHAT namespace this environment actually binds. Pages keeps a
  // separate preview namespace unless one is bound to both, and a chat that
  // silently writes into the wrong one looks exactly like a broken webhook.
  if (op === 'kvprobe') {
    if (!env.SDAR_CHAT) return json({ kv_bound: false });
    const probe = `probe:${Date.now()}`;
    await env.SDAR_CHAT.put(probe, 'ok', { expirationTtl: 60 });
    const back = await env.SDAR_CHAT.get(probe);
    const list = await env.SDAR_CHAT.list({ limit: 10 });
    return json({
      kv_bound: true,
      roundtrip: back === 'ok',
      keys: list.keys.map((k) => k.name)
    });
  }

  if (op === 'webhookinfo') {
    const info = await tg(env, 'getWebhookInfo', {});
    return json(info);
  }

  if (op === 'setwebhook') {
    const url = `${origin}/api/chat/webhook`;
    const res = await tg(env, 'setWebhook', {
      url,
      allowed_updates: ['message'],
      drop_pending_updates: true
    });
    return json({ url, result: res });
  }

  if (op === 'deletewebhook') {
    return json(await tg(env, 'deleteWebhook', { drop_pending_updates: false }));
  }

  return json({ error: 'unknown_op' }, 400);
}
