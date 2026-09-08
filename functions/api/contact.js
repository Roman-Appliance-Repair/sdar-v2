/**
 * POST /api/contact
 *
 * Multi-purpose logger/contact endpoint. Branches on payload.type or payload.name:
 *
 *   type: 'quote'       → 🧾 Quote Request      → Telegram monospace card + Resend email
 *   type: 'booking'     → 📅 Booking Request    → Telegram + Resend email
 *   type: 'callback'    → 📞 Call Back Request  → Telegram + Resend email
 *   type: 'pdf'         → 📄 PDF Request        → Telegram + Resend email WITH PDF attachment
 *   name: 'AI Diagnostics' (no other type) → 🤖 AI Diagnostics log only → Telegram
 *
 * Source markers for shared lgdryer + SDAR Telegram chat:
 *   payload.brand_site === 'samedayappliance.repair' → 🏠 SDAR prefix + branch routing
 *   otherwise → default lgdryer-style message
 *
 * Env vars:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   RESEND_API_KEY
 *   RESEND_FROM          (optional, default 'noreply@samedayappliance.repair')
 *   RESEND_TO            (optional, default 'info@samedayappliance.repair')
 *
 * Bindings (optional):
 *   SDAR_CHAT            KV — reused for the per-IP submit rate limit when present.
 *                        Without it the limiter degrades to a per-isolate in-memory map.
 *
 * Accepts application/json (the quote sheet + booking form) and
 * application/x-www-form-urlencoded (the no-JS QuoteFallbackForm, which needs an
 * HTML answer rather than JSON because the browser navigates to this URL).
 */

// SDAR branch routing — city slug → dispatcher phone
const SDAR_BRANCH_PHONES = {
  'pasadena': '(626) 376-4458',
  'beverly-hills': '(424) 248-1199',
  'thousand-oaks': '(424) 208-0228',
  'irvine': '(213) 401-9019',
  'rancho-cucamonga': '(909) 457-1030',
  'riverside': '(951) 577-3877',
  'temecula': '(951) 577-3877',
  'west-hollywood': '(323) 870-4790',
  'los-angeles': '(424) 325-0520'
};

// Rate limit: 5 submits / 10 min per IP. KV when a binding exists, in-memory
// (per-isolate, best effort) when it does not.
const NEWLINE = String.fromCharCode(10);
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const memoryHits = new Map();

function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  );
}

async function isRateLimited(env, ip) {
  const key = `qsrl:${ip}`;
  const now = Date.now();
  const fresh = (arr) => (Array.isArray(arr) ? arr : []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (env && env.SDAR_CHAT) {
    try {
      const hits = fresh(await env.SDAR_CHAT.get(key, 'json'));
      if (hits.length >= RATE_LIMIT_MAX) return true;
      hits.push(now);
      await env.SDAR_CHAT.put(key, JSON.stringify(hits), { expirationTtl: 900 });
      return false;
    } catch (e) {
      // KV unavailable — fall through to the in-memory path rather than 500.
    }
  }

  const hits = fresh(memoryHits.get(key));
  if (hits.length >= RATE_LIMIT_MAX) {
    memoryHits.set(key, hits);
    return true;
  }
  hits.push(now);
  memoryHits.set(key, hits);
  return false;
}

/** Read JSON or form-encoded. Returns { payload, isForm }. */
async function readPayload(request) {
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('form-urlencoded') || ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = typeof v === 'string' ? v : '';
    return { payload, isForm: true };
  }
  return { payload: await request.json(), isForm: false };
}

/** Honeypot. Real visitors never fill `website` / `_hp`. */
function isBot(p) {
  return Boolean(String(p._hp || p.website || '').trim());
}

function isSdar(p) {
  return p && p.brand_site === 'samedayappliance.repair';
}

function sdarBranch(p) {
  const slug = (p.city || 'los-angeles').toLowerCase();
  return {
    slug,
    phone: SDAR_BRANCH_PHONES[slug] || SDAR_BRANCH_PHONES['los-angeles']
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let isForm = false;

  try {
    const parsed = await readPayload(request);
    const payload = parsed.payload;
    isForm = parsed.isForm;
    const type = payload.type || null;
    const isAiLog = payload.name === '🤖 AI Diagnostics' && !type;

    // Honeypot: answer 200 so the bot sees success and does not retry, but do
    // nothing at all with the submission.
    if (isBot(payload)) {
      return isForm ? htmlAck() : json({ ok: true });
    }

    // Rate limit only the lead types; the AI diagnostic log is not a submit.
    if (!isAiLog && (await isRateLimited(env, clientIp(request)))) {
      return isForm
        ? htmlAck('Give it a few minutes', 'That is a few requests in a row from your connection. Please call the dispatcher and we will book you right now.')
        : json({ ok: false, error: 'rate_limited' }, 429);
    }

    // Build Telegram text by branch
    const tgText = buildTelegramText(payload);

    // Fire Telegram always
    const tgPromise = sendTelegram(env, tgText, payload);

    // Email + optional PDF
    let emailPromise = Promise.resolve();
    if (!isAiLog && env.RESEND_API_KEY) {
      emailPromise = sendEmail(env, payload);
    }

    // Run in parallel, don't fail the request if one sub-service fails
    await Promise.allSettled([tgPromise, emailPromise]);

    return isForm ? htmlAck() : json({ ok: true });
  } catch (err) {
    console.error('contact.js error:', err);
    return isForm
      ? htmlAck('That did not go through', 'So the request is not lost, please call the dispatcher directly.', 500)
      : json({ ok: false, error: 'Internal error' }, 500);
  }
}

// =====================================================================
// Telegram branching
// =====================================================================

function buildTelegramText(p) {
  // AI diagnostic log (no lead yet — dispatcher follow-up task)
  if (p.name === '🤖 AI Diagnostics' && !p.type) {
    const requestedAt = new Date().toLocaleString('ru-RU', { timeZone: 'America/Los_Angeles' });
    return [
      '🌐 SDAR AI DIAGNOSTIC | samedayappliance.repair/ai-diagnostic/',
      '─────────────────────',
      '📞 Задача диспетчеру: позвонить клиенту и продать визит техника',
      '─────────────────────',
      `👤 Клиент: ${escape(p.customerName || '—')}`,
      `📱 Телефон: ${escape(p.phone || '—')}`,
      `📧 Email: ${escape(p.email || '—')}`,
      `🕐 Время запроса: ${escape(requestedAt)}`,
      '─────────────────────',
      `🔧 Техника: ${escape(p.appliance || '—')} · ${escape(p.brand || '—')}${p.model ? ' · ' + escape(p.model) : ''}`,
      `❗ Проблема: ${escape(p.symptom || '—')}`,
      p.detail ? `📝 Детали: ${escape(truncate(p.detail, 300))}` : null,
      '─────────────────────',
      `🤖 AI диагноз: ${escape(p.result || '—')}`,
      '─────────────────────',
      // AID-3. Which page the card was on, and whether that page had already
      // answered the first steps for them. Until this wave every diagnostic lead
      // looked like it came from /ai-diagnostic/, because that is the only place
      // the form existed; now it can come from any of ~1000 pages, and the
      // dispatcher opening the card needs to see which one.
      `🌐 Страница: ${escape(p.page_url || '—')}`,
      `✍️ Предзаполнение со страницы: ${p.prefilled ? 'да' : 'нет'}`,
    ].filter(Boolean).join('\n');
  }

  if (p.type === 'quote') {
    return buildQuoteCard(p);
  }

  if (p.type === 'pdf') {
    return [
      '📄 <b>PDF Diagnosis Requested</b>',
      '',
      `<b>Email:</b> ${escape(p.email || '—')}`,
      `<b>Equipment:</b> ${escape(p.equipment || '—')}`,
      p.brand ? `<b>Brand:</b> ${escape(p.brand)}` : '',
      '',
      `<b>Diagnosis:</b>\n${escape(truncate(p.diagnosis || '—', 600))}`,
    ].filter(Boolean).join('\n');
  }

  if (p.type === 'callback') {
    const callbackDeadline = new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ru-RU', { timeZone: 'America/Los_Angeles' });
    const aiDiagnosisText = p.result || p.diagnosis || '';
    return [
      '📞 SDAR CALL BACK REQUEST',
      '─────────────────────',
      '⏰ ПЕРЕЗВОНИТЬ ДО: ' + escape(callbackDeadline) + ' (иначе скидка 5%)',
      '─────────────────────',
      '👤 Клиент: ' + escape(p.name || '—'),
      '📱 Телефон: ' + escape(p.phone || '—'),
      p.email ? '📧 Email: ' + escape(p.email) : null,
      '─────────────────────',
      p.appliance
        ? `🔧 Техника: ${escape(p.appliance)}${p.brand ? ' · ' + escape(p.brand) : ''}${p.model ? ' · ' + escape(p.model) : ''}`
        : (p.equipment ? `🔧 Техника: ${escape(p.equipment)}` : null),
      p.symptom ? `❗ Проблема: ${escape(p.symptom)}` : null,
      aiDiagnosisText ? `🤖 AI диагноз: ${escape(truncate(aiDiagnosisText, 400))}` : null,
    ].filter(Boolean).join('\n');
  }

  if (p.type === 'booking') {
    const sdar = isSdar(p);
    const branch = sdar ? sdarBranch(p) : null;
    return [
      sdar
        ? '🏠 <b>SDAR BOOKING REQUEST</b>\n🌐 samedayappliance.repair'
        : '📅 <b>NEW BOOKING REQUEST</b>',
      '',
      branch ? `<b>Branch:</b> ${escape(branch.slug)} → ${escape(branch.phone)}` : '',
      `<b>Phone:</b> ${escape(p.phone || '—')}`,
      p.name ? `<b>Name:</b> ${escape(p.name)}` : '',
      p.email ? `<b>Email:</b> ${escape(p.email)}` : '',
      `<b>Address:</b> ${escape(p.address || '—')}`,
      p.zip ? `<b>Zip:</b> ${escape(p.zip)}` : '',
      `<b>Equipment:</b> ${escape(p.equipment || '—')}`,
      p.brand ? `<b>Brand:</b> ${escape(p.brand)}` : '',
      p.model ? `<b>Model:</b> ${escape(p.model)}` : '',
      p.date ? `<b>Preferred date:</b> ${escape(p.date)}` : '',
      `<b>Time window:</b> ${escape(p.time || '—')}`,
      '',
      p.description ? `<b>Issue:</b>\n${escape(truncate(p.description, 600))}` : '',
      p.diagnosis ? `<b>AI said:</b>\n${escape(truncate(p.diagnosis, 500))}` : '',
    ].filter(Boolean).join('\n');
  }

  // Generic fallback
  return `📬 <b>New form submission</b>\n\n${escape(JSON.stringify(p, null, 2).slice(0, 800))}`;
}

/**
 * Quote-sheet card — plain text, no monospace block, so it reads the same on a
 * phone as on desktop and stays copy-pasteable line by line.
 *
 *   line 1  source banner
 *   line 2  fee + scope + how it arrived
 *   line 3  address warning, only when the address looks unusable
 *   then    WHAT THEY WANT / CLIENT / UNIT / PHOTOS, two-space indent
 *   footer  page + source
 */
function buildQuoteCard(p) {
  const row = (k, v) => (v || v === 0 ? '  ' + k + ': ' + escape(String(v)) : null);

  // The sheet sends a real branch name; the no-JS form has no ZIP field, so say so
  // plainly rather than printing a slug the dispatcher has to decode.
  const fallbackBranch = sdarBranch(p);
  const branchLabel = p.branch_label || 'not set (no ZIP)';
  const branchPhone = p.branch_phone || fallbackBranch.phone;
  const scope = p.scope_label || (p.where === 'commercial' ? 'in a business' : 'at home');
  const via = p.source === 'fallback-form' ? 'via form (no JS)' : 'via sheet';

  const whenMap = {
    asap: 'ASAP',
    today_tomorrow: 'Today or tomorrow',
    pick_date: p.visit_date || 'Specific date',
  };

  const head = [
    '🌐 Новый лид с сайта (samedayappliance.repair)',
    'DIAGNOSTIC ' + escape(p.price_display || '') + ' — ' + escape(scope) + ' · ' + via,
    addressBanner(p),
    '',
  ];

  const symptoms = Array.isArray(p.problems) ? p.problems.join(', ') : p.problems || '';

  const body = [
    'WHAT THEY WANT',
    row('Scope', scope),
    row('When', whenMap[p.visit_time] || p.visit_time || '—'),
    row('Branch', branchLabel + ' · ' + branchPhone),
    '',
    'CLIENT',
    row('Name', p.name || '—'),
    row('Phone', p.phone || '—'),
    row('Address', p.address || '—'),
    row('Verified', p.address_verified ? 'Google ✓' : 'no'),
    row('ZIP', zipLine(p)),
    zipOverridden(p) ? row('ZIP typed', p.zip_typed + ' — visitor typed this, routed on Google') : null,
    p.out_of_zone ? row('Out of zone', 'yes — confirm before dispatch') : null,
    p.notes ? row('Notes', truncate(p.notes, 300)) : null,
    '',
    'UNIT',
    row('Appliance', p.appliance_label || p.appliance || '—'),
    p.brand_label || p.brand ? row('Brand', p.brand_label || p.brand) : null,
    // Only when the page guessed for them. "changed" means the guess was wrong and
    // they corrected it — worth knowing before the van is stocked.
    p.appliance_prefilled
      ? row('Prefilled', p.appliance_changed ? 'yes — visitor changed it' : 'yes')
      : null,
    // AID-2. This lead came out of the AI diagnostic's verdict, so they have already
    // read the likely causes and a cost range before they asked for a truck.
    p.aid_handoff ? row('From AI diagnostic', 'yes') : null,
    symptoms ? row('Symptom', symptoms) : null,
    p.problem_text ? row('Detail', truncate(p.problem_text, 400)) : null,
    '',
    'PHOTOS',
    '',
  ];

  const foot = [
    'Страница: ' + escape(p.page_url || '—'),
    'Источник: samedayappliance.repair',
  ];

  return []
    .concat(head, body, foot)
    .filter((l) => l !== null)
    .join(NEWLINE);
}

/**
 * The ZIP line, with where the number came from. Dispatch routes on this one, so
 * saying whether Google supplied it or the visitor typed it is the difference
 * between a confident dispatch and a phone call to check.
 */
function zipLine(p) {
  const zip = p.zip || '—';
  if (!p.zip) return zip;
  return zip + (p.zip_google ? ' (Google)' : ' (typed)');
}

/** The visitor typed a ZIP that disagrees with the one Google returned. */
function zipOverridden(p) {
  return Boolean(p.zip_google && p.zip_typed && p.zip_typed !== p.zip_google);
}

/**
 * One banner line, in order of how much trouble it will cause dispatch:
 * an unusable address first, then an address Google never confirmed. A pick that
 * Google verified needs no warning at all.
 */
function addressBanner(p) {
  if (addressLooksIncomplete(p.address)) return 'ADDRESS INCOMPLETE — check by phone';
  if (!p.address_verified) return 'ADDRESS NOT VERIFIED — check by phone';
  return null;
}

/** No house number at the front, or too short to route a truck to. */
function addressLooksIncomplete(address) {
  const a = String(address || '').trim();
  if (a.length < 6) return true;
  return !/^\d/.test(a);
}

/** Plain-HTML answer for the no-JS form leg, which navigates here. */
function htmlAck(
  heading = 'Request received',
  body = 'A dispatcher will call or text you back. Phones are answered 24/7.',
  status = 200
) {
  const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(heading)} — Same Day Appliance Repair</title>
<style>body{margin:0;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f5f5f5;color:#1a1a1a}
main{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e2e2;border-radius:8px;padding:32px;text-align:center}
h1{font-family:Georgia,serif;font-size:1.6rem;margin:0 0 12px}
p{color:#6b6b6b;line-height:1.6;margin:0 0 20px}
a.call{display:inline-block;background:#C8102E;color:#fff;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:600}
a.back{display:block;margin-top:20px;color:#6b6b6b;font-size:14px}</style></head>
<body><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(body)}</p>
<a class="call" href="tel:+14243250520">Call (424) 325-0520</a>
<a class="back" href="/book/">Back to booking</a></main></body></html>`;
  return new Response(page, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// Telegram truncates a photo caption at 1024 characters. The card must never be
// cut, so anything longer goes out as its own message and the photos reply to it.
const TG_CAPTION_LIMIT = 1024;

async function tg(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, ...body }),
  });
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function sendTelegram(env, text, payload) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('Telegram env vars missing — skipping.');
    return;
  }

  const photos = (payload && Array.isArray(payload.photos) ? payload.photos : [])
    .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u))
    .slice(0, 10);

  // No photos, or not a quote — one plain message, as before.
  if (!photos.length) {
    await tg(env, 'sendMessage', { text, parse_mode: 'HTML', disable_web_page_preview: true });
    return;
  }

  // Card too long to ride as a caption: send it whole, hang the photos off it.
  if (text.length > TG_CAPTION_LIMIT) {
    const sent = await tg(env, 'sendMessage', {
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    const replyTo = sent && sent.result && sent.result.message_id;
    if (photos.length === 1) {
      await tg(env, 'sendPhoto', { photo: photos[0], reply_to_message_id: replyTo });
    } else {
      await tg(env, 'sendMediaGroup', {
        media: photos.map((u) => ({ type: 'photo', media: u })),
        reply_to_message_id: replyTo,
      });
    }
    return;
  }

  // Card fits: it becomes the caption, so the dispatcher sees photo and details together.
  if (photos.length === 1) {
    await tg(env, 'sendPhoto', { photo: photos[0], caption: text, parse_mode: 'HTML' });
    return;
  }

  await tg(env, 'sendMediaGroup', {
    media: photos.map((u, i) =>
      i === 0
        ? { type: 'photo', media: u, caption: text, parse_mode: 'HTML' }
        : { type: 'photo', media: u }
    ),
  });
}

// =====================================================================
// Resend email (with optional PDF attachment)
// =====================================================================

async function sendEmail(env, p) {
  const from = env.RESEND_FROM || 'Same Day Appliance Repair <noreply@samedayappliance.repair>';
  // SDAR bookings default to info@samedayappliance.repair; all others to Roman's ops inbox
  const defaultTo = isSdar(p) ? 'info@samedayappliance.repair' : 'abysov@gmail.com';
  const internalTo = env.RESEND_TO || defaultTo;

  // If PDF request — send the PDF TO the user, internal copy to ops
  if (p.type === 'pdf' && p.email && p.pdfBase64) {
    // Send to user
    await resendSend(env, {
      from,
      to: [p.email],
      subject: '📄 Your appliance diagnosis — Same Day Appliance Repair',
      html: buildPdfUserEmail(p),
      attachments: [{
        filename: `SDAR-Diagnosis.pdf`,
        content: p.pdfBase64,
      }],
    });
    // Internal log copy (no attachment, keep inbox slim)
    await resendSend(env, {
      from,
      to: [internalTo],
      subject: `📄 PDF sent to ${p.email}`,
      html: buildInternalCopy(p),
    });
    return;
  }

  // Other types: internal ops copy
  const sdar = isSdar(p);
  const branch = sdar ? sdarBranch(p) : null;
  const sdarPrefix = sdar ? '🏠 SDAR ' : '';
  const branchTag = branch ? ` [${branch.slug}]` : '';
  const subjectMap = {
    callback: `${sdarPrefix}📞 Call Back — ${p.phone || 'no phone'}${branchTag}`,
    booking: `${sdarPrefix}📅 Booking — ${p.phone || 'no phone'}${branchTag}`,
    quote: `${sdarPrefix}🧾 Quote — ${p.phone || 'no phone'}${branchTag}`,
  };
  const subject = subjectMap[p.type] || `📬 Form submission`;

  await resendSend(env, {
    from,
    to: [internalTo],
    subject,
    html: buildInternalCopy(p),
  });
}

async function resendSend(env, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('Resend error:', res.status, t);
  }
}

function buildPdfUserEmail(p) {
  const diag = escapeHtml(p.diagnosis || '');
  return `
<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#0a0a0a;padding:28px;color:#fff;">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Same Day</div>
      <div style="color:#C8102E;font-size:11px;letter-spacing:0.18em;margin-top:4px;">APPLIANCE REPAIR</div>
    </div>
    <div style="padding:32px;color:#1a1a1a;">
      <h2 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;">Your diagnosis is attached</h2>
      <p style="font-size:15px;line-height:1.6;color:#3a3a3a;">
        Thanks for using our AI diagnostic tool. Your preliminary report is attached as a PDF —
        share it with family, post it on Reddit, or keep it for reference.
      </p>
      <div style="background:#f5f5f5;border-left:3px solid #C8102E;padding:16px 20px;margin:20px 0;font-size:14px;line-height:1.6;">
        <strong style="color:#C8102E;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">AI Diagnosis</strong><br>
        <span style="color:#1a1a1a;">${diag}</span>
      </div>
      <p style="font-size:14px;line-height:1.6;">
        When you want a BHGS-licensed technician to confirm and fix it, call us —
        the <strong>$89 diagnostic is waived</strong> when you approve the repair.
      </p>
      <p style="text-align:center;margin:28px 0 12px;">
        <a href="tel:+13238704790" style="display:inline-block;background:#C8102E;color:#fff;padding:14px 32px;font-weight:600;text-decoration:none;border-radius:4px;font-size:15px;">Call (323) 870-4790</a>
      </p>
      <p style="font-size:12px;color:#6b6b6b;text-align:center;margin-top:24px;line-height:1.6;">
        West Hollywood · Los Angeles · Thousand Oaks · Pasadena · Irvine<br>
        BHGS #A49573 · EPA 608 Universal #1346255700410 · CSLB C-20 HVAC · BBB Accredited Business
      </p>
    </div>
  </div>
</body></html>`;
}

function buildInternalCopy(p) {
  const lines = [];
  if (isSdar(p)) {
    const b = sdarBranch(p);
    lines.push(`<strong>Source:</strong> 🏠 SDAR — samedayappliance.repair`);
    lines.push(`<strong>Branch:</strong> ${escapeHtml(b.slug)} → ${escapeHtml(b.phone)}`);
  }
  if (p.type) lines.push(`<strong>Type:</strong> ${escapeHtml(p.type)}`);
  if (p.name) lines.push(`<strong>Name:</strong> ${escapeHtml(p.name)}`);
  if (p.phone) lines.push(`<strong>Phone:</strong> ${escapeHtml(p.phone)}`);
  if (p.email) lines.push(`<strong>Email:</strong> ${escapeHtml(p.email)}`);
  if (p.address) lines.push(`<strong>Address:</strong> ${escapeHtml(p.address)}`);
  if (p.zip) lines.push(`<strong>Zip:</strong> ${escapeHtml(p.zip)}`);
  if (p.date) lines.push(`<strong>Preferred date:</strong> ${escapeHtml(p.date)}`);
  if (p.time) lines.push(`<strong>Time:</strong> ${escapeHtml(p.time)}`);
  if (p.equipment) lines.push(`<strong>Equipment:</strong> ${escapeHtml(p.equipment)}`);
  if (p.brand) lines.push(`<strong>Brand:</strong> ${escapeHtml(p.brand)}`);
  if (p.model) lines.push(`<strong>Model:</strong> ${escapeHtml(p.model)}`);
  if (p.description) lines.push(`<strong>Reported issue:</strong><br>${escapeHtml(p.description)}`);
  if (p.diagnosis) lines.push(`<br><strong>AI Diagnosis:</strong><br>${escapeHtml(p.diagnosis)}`);
  return `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;">${lines.join('<br>')}</div>`;
}

// =====================================================================
// Helpers
// =====================================================================

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escape(s) {
  return String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}
