// functions/api/chat/_shared.js
//
// Helpers shared by the chat endpoints. Files prefixed with `_` are not routed
// by Pages Functions, so this is a plain module, not an endpoint.
//
// KV layout (namespace SDAR_CHAT):
//   session:<session_id>  → the session object (see newSession)
//   msg:<message_id>      → session_id, for every message THIS BOT put in the
//                           group for that session (the card and each relay).
//                           A dispatcher reply is matched by looking up the
//                           message it replied to — O(1), no list() scan.

export const SESSION_TTL = 7 * 24 * 60 * 60;

export function groupId(env) {
  // TG_GROUP_ID is the chat-v2 secret; CHAT_TG_GROUP_ID is the pre-chat-v2 name,
  // kept as a fallback so a half-applied env does not silently post nowhere.
  return String(env.TG_GROUP_ID || env.CHAT_TG_GROUP_ID || '');
}

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** US phone → +1XXXXXXXXXX. Returns '' when it is not a valid US number. */
export function normalizeUsPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d[0] === '1') return `+${d}`;
  return '';
}

export async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${env.CHAT_TG_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  try {
    return await res.json();
  } catch {
    return { ok: false, description: `non-json response (${res.status})` };
  }
}

/** Post into the group. Every message we send is registered in KV so the
 *  dispatcher can reply to ANY of them, not only to the card. */
export async function postToGroup(env, session, text, extra = {}) {
  const data = await tg(env, 'sendMessage', {
    chat_id: groupId(env),
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra
  });
  if (data && data.ok && data.result) {
    await rememberMessage(env, data.result.message_id, session.session_id);
  }
  return data;
}

// Preview environments do not always have the KV namespace bound, and the quote
// sheet posts photos with a synthetic `quote-…` id that owns no session. Every
// accessor below tolerates a missing binding rather than throwing mid-request.
export async function rememberMessage(env, messageId, sessionId) {
  if (!env.SDAR_CHAT) return;
  await env.SDAR_CHAT.put(`msg:${messageId}`, sessionId, { expirationTtl: SESSION_TTL });
}

export async function getSession(env, sessionId) {
  if (!env.SDAR_CHAT) return null;
  return env.SDAR_CHAT.get(`session:${sessionId}`, 'json');
}

export async function putSession(env, session) {
  if (!env.SDAR_CHAT) return;
  await env.SDAR_CHAT.put(`session:${session.session_id}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL
  });
}

/** Append a message and bump the monotonic index the widget polls against. */
export function appendMessage(session, from, text) {
  session.last_index = (session.last_index || 0) + 1;
  session.messages.push({ from, text, ts: Date.now(), index: session.last_index });
  return session.last_index;
}
