/**
 * POST /api/diagnose
 *
 * Proxies AI diagnostic requests to Anthropic's Messages API.
 * Called from AiDiagnostic.astro client-side script on samedayappliance.repair.
 *
 * Request body:
 *   {
 *     sector: 'residential' | 'commercial',
 *     category: string,            // e.g. 'Cooking'
 *     equipment: string,           // e.g. 'refrigerator'
 *     equipmentLabel: string,      // e.g. 'Refrigerator'
 *     brand?: string,              // e.g. 'Sub-Zero'
 *     model?: string,              // e.g. 'BI-48SD'
 *     description: string,         // symptom description
 *   }
 *
 * Response:
 *   { result: string }             // 3-4 sentence diagnosis
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY
 */

/**
 * The model this endpoint calls. `claude-sonnet-4-20250514` was retired upstream:
 * every request came back 404 not_found_error with the message "model:
 * claude-sonnet-4-20250514", so the page had been serving its own error fallback
 * to every visitor. A model id is the one string here that expires on someone
 * else's schedule, so it lives in one named place.
 */
const MODEL = 'claude-sonnet-4-6';

// Rate limit: 5 calls / 10 min per IP — the same numbers and the same KV
// namespace contact.js uses, so one visitor cannot be throttled on one endpoint
// and wide open on the other. KV when the binding exists, per-isolate memory
// when it does not, because a missing binding must not 500 a diagnosis.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const memoryHits = new Map();

/** Longest description the model is asked to read. Anything past this is noise
 *  to the diagnosis and cost to us. */
const MAX_DESCRIPTION = 1500;

function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  );
}

async function isRateLimited(env, ip) {
  const key = `aidrl:${ip}`;
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

/** Honeypot, same field names contact.js uses. A real visitor never fills these. */
function isBot(p) {
  return Boolean(String(p._hp || p.website || '').trim());
}

/** What a visitor sees when we will not call the model. Deliberately the same
 *  wording in every case — a bot learns nothing from it, and a person who hit the
 *  limit still gets a number to call. */
const FALLBACK =
  `Our AI is taking a breather — call (323) 870-4790 for a free phone diagnosis. A real tech can walk through what's wrong in 2 minutes.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle CORS preflight if needed
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const payload = await request.json();

    // A bot gets a 200 and the fallback text. Answering 403 would tell it which
    // field gave it away; this way it cannot tell success from failure.
    if (isBot(payload)) {
      return json({ result: FALLBACK }, 200, corsHeaders);
    }

    if (await isRateLimited(env, clientIp(request))) {
      return json({ result: FALLBACK, error: 'rate_limited' }, 429, corsHeaders);
    }

    // Build a description from whatever the client sends. If the explicit
    // `description` field is missing/empty, fall back to `detail`, then to a
    // synthesized "<symptom> on <appliance> <brand>" line. No min-length gate.
    const description = String(
      payload.description ||
      payload.detail ||
      `${payload.symptom || ''} on ${payload.appliance || ''} ${payload.brand || ''}`
    ).trim().slice(0, MAX_DESCRIPTION);

    // Nothing to diagnose. The island gates on brand + symptom, so an empty
    // description here means the request did not come from the island.
    if (!description) {
      return json({ result: FALLBACK, error: 'empty' }, 400, corsHeaders);
    }

    const sector = payload.sector === 'commercial' ? 'commercial' : 'residential';
    const equipmentLabel = sanitize(payload.equipmentLabel || payload.equipment || 'appliance');
    const category = sanitize(payload.category || '');
    const diagnosticFee = ['restaurant', 'cold', 'ice'].includes(category) ? '$120' : '$89';
    const brand = sanitize(payload.brand || '');
    const model = sanitize(payload.model || '');

    // Pricing context based on sector
    const priceContext = sector === 'commercial'
      ? 'Commercial repairs: $200–$800 typical range (refrigeration $300–$1200, ice machines $250–$700, fryers $200–$500, commercial dishwashers $250–$600). Diagnostic $120 — waived with repair.'
      : 'Residential repairs: refrigerators $200–$450 ($300–$700+ for Sub-Zero/Wolf/Thermador built-ins), washers/dryers $150–$350 ($200–$450 Miele/Bosch), ovens/ranges $175–$420 ($250–$500+ Wolf/Viking/Thermador), dishwashers $150–$320 ($200–$450 Miele). Diagnostic $89 — waived with repair.';

    const systemPrompt = `You are a senior appliance repair technician at Same Day Appliance Repair, Los Angeles.
BHGS #A49573, CSLB C-20, EPA 608 Universal certified.

The client described a problem with their appliance. Always respond in English only.

Structure your response as follows:
1. List 3-4 most likely causes, ordered from most probable to least probable. For each cause give 1-2 sentences of explanation with specific technical detail (component names, failure patterns, model-specific notes if brand/model provided).
2. Mention the estimated repair cost range. Always add this exact disclaimer after the number: "This is a base labor estimate — the figure is approximate and does not include parts."
3. Final line: call to action to book same-day visit or request callback. Mention ${diagnosticFee} diagnostic fee is waived if repair is approved.

Be direct, technical, honest. Never say "I recommend" — say "our technicians". Max 200 words.`;

    const userContent = `Customer's description: ${description}`;

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 450,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic API error:', apiRes.status, errText);
      return json({
        result: FALLBACK,
      }, 200, corsHeaders);
    }

    const data = await apiRes.json();
    const text = data.content?.[0]?.text
      || 'Call (323) 870-4790 for a free phone diagnosis.';

    return json({ result: text.trim() }, 200, corsHeaders);
  } catch (err) {
    console.error('diagnose.js error:', err);
    return json({
      result: `Something went sideways on our end — call (323) 870-4790 and we'll sort it out over the phone.`,
    }, 200, corsHeaders);
  }
}

// Handle preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helpers
function sanitize(s) {
  return String(s || '').replace(/[<>]/g, '').slice(0, 80).trim();
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}
