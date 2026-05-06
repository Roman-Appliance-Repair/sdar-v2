/**
 * GET /api/debug
 *
 * TEMPORARY diagnostic endpoint — shows whether env vars reach the function.
 * Does NOT reveal full secrets — only length + first 15 chars.
 *
 * REMOVE THIS FILE after debugging is done.
 */

export async function onRequestGet(context) {
  const { env } = context;

  const report = {
    timestamp: new Date().toISOString(),
    keys: {
      ANTHROPIC_API_KEY: redact(env.ANTHROPIC_API_KEY),
      TELEGRAM_BOT_TOKEN: redact(env.TELEGRAM_BOT_TOKEN),
      TELEGRAM_CHAT_ID: redact(env.TELEGRAM_CHAT_ID, true), // show full — not a secret
      RESEND_API_KEY: redact(env.RESEND_API_KEY),
      RESEND_FROM: env.RESEND_FROM || '(not set)',
      RESEND_TO: env.RESEND_TO || '(not set)',
    },
    anthropic_test: await testAnthropic(env),
    telegram_test: await testTelegram(env),
    resend_test: await testResend(env),
  };

  return new Response(JSON.stringify(report, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function redact(value, showFull = false) {
  if (value === undefined || value === null) return '❌ NOT SET';
  if (value === '') return '⚠️ EMPTY STRING';
  const s = String(value);
  if (showFull) return s;
  return `✅ ${s.slice(0, 15)}... (${s.length} chars)`;
}

async function testAnthropic(env) {
  if (!env.ANTHROPIC_API_KEY) return '❌ ANTHROPIC_API_KEY not set';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'say hi' }],
      }),
    });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      body_preview: text.slice(0, 300),
    };
  } catch (err) {
    return `❌ Exception: ${err.message}`;
  }
}

async function testResend(env) {
  if (!env.RESEND_API_KEY) return '❌ RESEND_API_KEY not set';
  const fromEmail = env.RESEND_FROM || 'noreply@samedayappliance.repair';
  const toEmail = env.RESEND_TO || 'info@samedayappliance.repair';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: '🔧 SDAR Debug Test',
        text: 'This is a test email from /api/debug. If you see this, Resend integration works.',
      }),
    });
    const body = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      from: fromEmail,
      to: toEmail,
      body_preview: body.slice(0, 400),
    };
  } catch (err) {
    return `❌ Exception: ${err.message}`;
  }
}

async function testTelegram(env) {
  if (!env.TELEGRAM_BOT_TOKEN) return '❌ TELEGRAM_BOT_TOKEN not set';
  if (!env.TELEGRAM_CHAT_ID) return '❌ TELEGRAM_CHAT_ID not set';
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: '🔧 Debug test from sdar-v2 — if you see this, env vars work',
      }),
    });
    const text = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      body_preview: text.slice(0, 300),
    };
  } catch (err) {
    return `❌ Exception: ${err.message}`;
  }
}
