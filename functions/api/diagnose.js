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

    // Pricing context based on sector
    const priceContext = sector === 'commercial'
      ? 'Commercial repairs: $200–$800 typical range (refrigeration $300–$1200, ice machines $250–$700, fryers $200–$500, commercial dishwashers $250–$600). Diagnostic $120 — waived with repair.'
      : 'Residential repairs: refrigerators $200–$450 ($300–$700+ for Sub-Zero/Wolf/Thermador built-ins), washers/dryers $150–$350 ($200–$450 Miele/Bosch), ovens/ranges $175–$420 ($250–$500+ Wolf/Viking/Thermador), dishwashers $150–$320 ($200–$450 Miele). Diagnostic $89 — waived with repair.';

    const systemPrompt = `You are a senior technician at Same Day Appliance Repair — a CSLB C-20 licensed, BBB A+ accredited, EPA-certified shop serving Los Angeles, Orange, and Ventura counties. You have 15+ years of hands-on appliance and commercial refrigeration experience.

A customer is describing a problem with their ${sector} ${equipmentLabel.toLowerCase()}${brand ? ' (' + brand + (model ? ', model ' + model : '') + ')' : ''}.

Write a preliminary diagnosis in 4–6 sentences that sounds like a real tech thinking out loud, not corporate copy. Cover:

1. Most likely cause — be specific about the part or failure mode (not vague "could be a few things").
2. Whether this is typically a DIY fix or needs a pro (most aren't DIY; mention why briefly).
3. A realistic repair cost range for ${brand || 'this type of unit'}. ${priceContext}
4. Whether same-day service is realistic for this issue.
5. Close with a direct line: call (323) 870-4790 to get a C-20 tech out today. The $${sector === 'commercial' ? '120' : '89'} diagnostic is waived when they approve the repair.

Do NOT:
- Use phrases like "we understand the urgency", "certified technicians", "peace of mind", "hassle-free", "look no further".
- Make claims about specific lifespans or warranties.
- Recommend buying a new appliance unless repair clearly doesn't pencil out (over 50% of replacement cost).
- Start with "Based on your description" or similar filler.

Start with a direct observation about what's probably happening. Sound like a tech who's seen this a hundred times.`;

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
