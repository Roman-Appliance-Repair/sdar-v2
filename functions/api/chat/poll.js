// GET /api/chat/poll?session_id=X&since=N
//
// Return messages added since index N. The widget polls every 3 s while the
// panel is open to surface dispatcher replies (and on first open to rehydrate
// history). User-authored messages are still returned so reloads can re-paint
// the conversation.

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const since = parseInt(url.searchParams.get('since') || '0', 10);

  if (!sessionId) {
    return json({ error: 'no_session' }, 400);
  }

  const session = await env.SDAR_CHAT.get(`session:${sessionId}`, 'json');
  if (!session) {
    return json({ messages: [], last_index: 0 });
  }

  const newMessages = (session.messages || []).filter((m) => (m.index || 0) > since);

  return json({
    messages: newMessages,
    last_index: session.last_index || 0
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}
