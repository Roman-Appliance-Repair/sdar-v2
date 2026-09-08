// POST /api/chat/send
//
// A message from the chat widget. The first one of a session posts the lead
// card into the dispatcher group (TG_GROUP_ID — an ordinary group chat, no
// forum topics) and answers the client with the auto-reply. Every later message
// is relayed as a reply to that card, so one conversation stays one thread.
//
// Env bindings expected:
//   CHAT_TG_BOT_TOKEN   Telegram bot token
//   TG_GROUP_ID         Dispatcher group chat ID (falls back to CHAT_TG_GROUP_ID)
//   TG_OWNER_ID         Owner's Telegram user ID — gets a DM if the card fails
//   SDAR_CHAT           KV namespace (sessions + message index)

import {
  json, escapeHtml, normalizeUsPhone, tg, postToGroup, rememberMessage,
  getSession, putSession, appendMessage, groupId
} from './_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const {
      session_id, message, name, phone,
      page_url, page_path, branch_city, branch_phone,
      referrer, user_agent
    } = body || {};

    if (!session_id || typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return json({ error: 'invalid' }, 400);
    }
    // Without KV there is no session and no reply path — say so instead of
    // half-delivering a lead the dispatcher can never answer.
    if (!env.SDAR_CHAT) return json({ error: 'kv_unbound' }, 503);

    let session = await getSession(env, session_id);

    if (!session) {
      // Screens 1 and 2 run before any message can be sent, so name and phone
      // are mandatory here — a session without them would produce a card the
      // dispatcher cannot act on.
      const cleanName = String(name || '').trim().slice(0, 80);
      const e164 = normalizeUsPhone(phone);
      if (cleanName.length < 2 || !e164) {
        return json({ error: 'need_contact' }, 400);
      }

      session = {
        session_id,
        name: cleanName,
        phone: e164,
        page_path: page_path || '/',
        page_url: page_url || '',
        branch_city: String(branch_city || 'West Hollywood').slice(0, 60),
        branch_phone: String(branch_phone || '(323) 870-4790').slice(0, 20),
        referrer: referrer || '',
        user_agent: user_agent || '',
        card_message_id: null,
        created_at: Date.now(),
        messages: [],
        last_index: 0
      };

      const card = [
        '🟢 <b>New chat</b>',
        `Name: ${escapeHtml(session.name)}`,
        // Telegram clients auto-link a bare E.164 number, so it is tappable
        // without an <a href="tel:"> (which Telegram HTML would reject).
        `Phone: ${escapeHtml(session.phone)}`,
        `Page: ${escapeHtml(session.page_path)}`,
        `Branch: ${escapeHtml(session.branch_city)}`,
        '─────',
        escapeHtml(message.trim())
      ].join('\n');

      const sent = await tg(env, 'sendMessage', {
        chat_id: groupId(env),
        text: card,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      if (!sent || !sent.ok) {
        await notifyOwner(env, `⚠️ Site chat: card failed — ${sent && sent.description}`);
        return json({ error: 'card_failed', detail: sent && sent.description }, 502);
      }

      session.card_message_id = sent.result.message_id;
      await rememberMessage(env, session.card_message_id, session_id);

      appendMessage(session, 'user', message.trim());
      appendMessage(
        session,
        'bot',
        `Thanks, ${session.name}! A dispatcher will reply in a couple of minutes. ` +
        `If it's urgent, call ${session.branch_phone}.`
      );
      await putSession(env, session);

      return json({
        ok: true,
        last_index: session.last_index,
        auto_reply: session.messages[session.messages.length - 1].text
      });
    }

    // Follow-up message — relay as a reply on the card.
    appendMessage(session, 'user', message.trim());
    await putSession(env, session);

    await postToGroup(env, session, `💬 ${escapeHtml(message.trim())}`, {
      reply_to_message_id: session.card_message_id
    });

    return json({ ok: true, last_index: session.last_index });
  } catch (err) {
    return json({ error: 'server', detail: String(err) }, 500);
  }
}

/** Best-effort DM to the owner. Never throws: a failed alert must not fail a lead. */
async function notifyOwner(env, text) {
  if (!env.TG_OWNER_ID) return;
  try {
    await tg(env, 'sendMessage', { chat_id: env.TG_OWNER_ID, text });
  } catch { /* ignore */ }
}
