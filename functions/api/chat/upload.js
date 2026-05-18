// POST /api/chat/upload  (multipart/form-data)
//
// Photo upload from the chat widget. Stores in R2 via the S3-compatible API
// (aws4fetch handles request signing), then echoes the public URL back to the
// widget and forwards the image to the Telegram dispatcher topic.
//
// Fields: file, session_id, page_path

import { AwsClient } from 'aws4fetch';

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

    const sessionKey = `session:${sessionId}`;
    const session = await env.SDAR_CHAT.get(sessionKey, 'json');
    if (session) {
      session.last_index = (session.last_index || 0) + 1;
      session.messages.push({
        from: 'photo',
        text: publicUrl,
        ts: Date.now(),
        index: session.last_index
      });
      await env.SDAR_CHAT.put(sessionKey, JSON.stringify(session), { expirationTtl: 7 * 24 * 60 * 60 });

      await fetch(`https://api.telegram.org/bot${env.CHAT_TG_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.CHAT_TG_GROUP_ID,
          message_thread_id: session.topic_id,
          photo: publicUrl,
          caption: `📷 User uploaded photo${pagePath ? ' from ' + pagePath : ''}`
        })
      });
    }

    return json({ public_url: publicUrl });
  } catch (err) {
    return json({ error: 'server', detail: String(err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
