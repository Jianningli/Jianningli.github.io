/* =============================================================
   worker.js — Cloudflare Worker proxy for Gemini API
   =============================================================
   IMPORTANT: In Cloudflare dashboard, go to your Worker →
   Settings → Variables and Secrets → add a Secret named:
       GEMINI_API_KEY
   with your key from aistudio.google.com as the value.
   ============================================================= */

const GEMINI_MODEL = 'gemini-2.5-flash';

export default {
  async fetch(request, env) {

    const cors = {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Check the secret is configured right
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret not configured in Cloudflare Worker settings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    let upstream;
    try {
      upstream = await fetch(geminiURL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Gemini unreachable', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const responseText = await upstream.text();

    return new Response(responseText, {
      status : upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...cors,
      },
    });
  },
};
