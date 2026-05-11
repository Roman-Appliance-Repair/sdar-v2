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

    // Validate inputs
    const description = typeof payload.description === 'string' ? payload.description.slice(0, 1000).trim() : '';
    if (!description || description.length < 10) {
      return json({ error: 'Description required (min 10 chars).' }, 400, corsHeaders);
    }

    const sector = payload.sector === 'commercial' ? 'commercial' : 'residential';
    const equipmentLabel = sanitize(payload.equipmentLabel || payload.equipment || 'appliance');
    const category = sanitize(payload.category || '');
    const brand = sanitize(payload.brand || '');
    const model = sanitize(payload.model || '');
    const serviceUrl = String(payload.serviceUrl || 'https://samedayappliance.repair/services/').slice(0, 200);

    // Pricing context based on sector
    const priceContext = sector === 'commercial'
      ? 'Commercial repairs: $200–$800 typical range (refrigeration $300–$1200, ice machines $250–$700, fryers $200–$500, commercial dishwashers $250–$600). Diagnostic $120 — waived with repair.'
      : 'Residential repairs: refrigerators $200–$450 ($300–$700+ for Sub-Zero/Wolf/Thermador built-ins), washers/dryers $150–$350 ($200–$450 Miele/Bosch), ovens/ranges $175–$420 ($250–$500+ Wolf/Viking/Thermador), dishwashers $150–$320 ($200–$450 Miele). Diagnostic $89 — waived with repair.';

    const systemPrompt = `You are a senior appliance repair technician at Same Day Appliance Repair, Los Angeles.
BHGS #A49573, CSLB C-20, EPA 608 Universal certified.

The client described a problem with their appliance. Give a diagnostic response in the same language the client used.

Structure your response as follows:
1. List 3-4 most likely causes, ordered from most probable to least probable. For each cause give 1-2 sentences of explanation with specific technical detail (component names, failure patterns, model-specific notes if brand/model provided).
2. Mention the estimated repair cost range. Always add this exact disclaimer after the number: "Это базовая стоимость работ — цифра приблизительная и не включает стоимость запчастей, материалов и расходников. Точная стоимость определяется только после визита техника на месте."
3. End with one sentence mentioning the relevant service page: ${serviceUrl}
4. Final line: call to action to book same-day visit or request callback. Mention $89 diagnostic fee is waived if repair is approved.

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 450,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Anthropic API error:', apiRes.status, errText);
      return json({
        result: `Our AI had a hiccup — call (323) 870-4790 for a free phone diagnosis. A real tech can walk through what's wrong in 2 minutes.`,
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
