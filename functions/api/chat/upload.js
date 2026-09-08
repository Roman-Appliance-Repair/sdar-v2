// POST /api/chat/upload  (multipart/form-data)
//
// Photo upload from the chat widget. Stores in R2 via the S3-compatible API
// (aws4fetch handles request signing), then echoes the public URL back to the
// widget and forwards the image to the Telegram dispatcher topic.
//
// The photo is posted into the dispatcher group as a REPLY on the session's
// lead card, so it lands under the conversation it belongs to.
//
// Fields: file, session_id, page_path

import { AwsClient } from 'aws4fetch';
import { json, groupId, getSession, putSession, appendMessage, rememberMessage, tg } from './_shared.js';

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('session_id');
    const pagePath = formData.get('page_path') || '';

    if (!file || !sessionId || typeof file === 'string') {
      return json({ error: 'invalid' }, 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return json({ error: 'too_large' }, 400);
    }

    const mime = file.type || 'image/jpeg';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(mime)) {
      return json({ error: 'unsupported_type' }, 400);
    }

    const ext = mime.split('/')[1] || 'jpg';
    const key = `chat/${sessionId}/${Date.now()}.${ext}`;

    const aws = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto'
    });

    const buffer = await file.arrayBuffer();
    const uploadUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}`;

    const uploadRes = await aws.fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
      headers: { 'Content-Type': mime }
    });

    if (!uploadRes.ok) {
      return json({ error: 'upload_failed', status: uploadRes.status }, 500);
    }

    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

    // The quote sheet uploads with a synthetic `quote-…` session id and has no chat
    // session, and Preview environments may not bind the KV namespace at all. The
    // file is already in R2 by this point — never fail the upload over the log.
    const session = await getSession(env, sessionId);
    if (session) {
      appendMessage(session, 'photo', publicUrl);
      await putSession(env, session);

      const sent = await tg(env, 'sendPhoto', {
        chat_id: groupId(env),
        reply_to_message_id: session.card_message_id,
        photo: publicUrl,
        caption: `\u{1F4F7} Photo from ${session.name || 'client'}${pagePath ? ' · ' + pagePath : ''}`
      });
      if (sent && sent.ok && sent.result) {
        await rememberMessage(env, sent.result.message_id, sessionId);
      }
    }

    return json({ public_url: publicUrl });
  } catch (err) {
    return json({ error: 'server', detail: String(err) }, 500);
  }
}

