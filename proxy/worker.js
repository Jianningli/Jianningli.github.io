/* =============================================================
   worker.js — Cloudflare Worker proxy for Gemini API
   =============================================================
   Your Gemini API key lives here as a secret env variable,
   never in the public GitHub repo.

   SETUP INSTRUCTIONS (full steps in README below this file)
   ============================================================= */

const ALLOWED_ORIGIN = 'https://jianningli.github.io'; // your GitHub Pages URL
const GEMINI_MODEL   = 'gemini-2.0-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export default {
  async fetch(request, env) {

    // ── CORS preflight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // ── Only allow POST ─────────────────────────────────────────
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    // ── Parse request body ──────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    // ── Forward to Gemini with the secret key ───────────────────
    const geminiURL = `${GEMINI_URL}?key=${env.GEMINI_API_KEY}`;

    let upstream;
    try {
      upstream = await fetch(geminiURL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
    } catch (err) {
      return json({ error: 'Failed to reach Gemini API', detail: err.message }, 502);
    }

    const responseText = await upstream.text();

    return new Response(responseText, {
      status : upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin' : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}