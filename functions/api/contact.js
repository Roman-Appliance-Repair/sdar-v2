/**
 * POST /api/contact
 *
 * Multi-purpose logger/contact endpoint. Branches on payload.type or payload.name:
 *
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
 */

// SDAR branch routing — city slug → dispatcher phone
const SDAR_BRANCH_PHONES = {
  'pasadena': '(626) 376-4458',
  'beverly-hills': '(424) 248-1199',
  'thousand-oaks': '(424) 208-0228',
  'irvine': '(213) 401-9019',
  'rancho-cucamonga': '(909) 457-1030',
  'temecula': '(951) 577-3877',
  'west-hollywood': '(323) 870-4790',
  'los-angeles': '(424) 325-0520'
};

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

  try {
    const payload = await request.json();
    const type = payload.type || null;
    const isAiLog = payload.name === '🤖 AI Diagnostics' && !type;

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

    return json({ ok: true });
  } catch (err) {
    console.error('contact.js error:', err);
    return json({ ok: false, error: 'Internal error' }, 500);
  }
}

// =====================================================================
// Telegram branching
// =====================================================================

function buildTelegramText(p) {
  // AI diagnostic log (no lead yet)
  if (p.name === '🤖 AI Diagnostics' && !p.type) {
    return [
      '🤖 <b>AI Diagnostics used</b>',
      '',
      `<b>Sector:</b> ${escape(p.sector || '—')}`,
      `<b>Equipment:</b> ${escape(p.equipmentLabel || p.equipment || '—')}`,
      p.brand ? `<b>Brand:</b> ${escape(p.brand)}` : '',
      p.model ? `<b>Model:</b> ${escape(p.model)}` : '',
      '',
      `<b>Issue:</b> ${escape(truncate(p.description || '—', 400))}`,
    ].filter(Boolean).join('\n');
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
    return [
      '📞 <b>CALL BACK REQUEST</b>',
      '',
      `<b>Phone:</b> ${escape(p.phone || '—')}`,
      `<b>Equipment:</b> ${escape(p.equipment || '—')}`,
      p.brand ? `<b>Brand:</b> ${escape(p.brand)}` : '',
      p.model ? `<b>Model:</b> ${escape(p.model)}` : '',
      '',
      p.diagnosis ? `<b>AI said:</b>\n${escape(truncate(p.diagnosis, 500))}` : '',
      '',
      '⏱ Call within 10 minutes.',
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

async function sendTelegram(env, text, payload) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('Telegram env vars missing — skipping.');
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
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
        When you want a real C-20 technician to confirm and fix it, call us —
        the <strong>$89 diagnostic is waived</strong> when you approve the repair.
      </p>
      <p style="text-align:center;margin:28px 0 12px;">
        <a href="tel:+13238704790" style="display:inline-block;background:#C8102E;color:#fff;padding:14px 32px;font-weight:600;text-decoration:none;border-radius:4px;font-size:15px;">Call (323) 870-4790</a>
      </p>
      <p style="font-size:12px;color:#6b6b6b;text-align:center;margin-top:24px;line-height:1.6;">
        West Hollywood · Los Angeles · Thousand Oaks · Pasadena · Irvine<br>
        CSLB C-20 #1138898 · BBB A+ · EPA 608 Certified · Fully Insured
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
