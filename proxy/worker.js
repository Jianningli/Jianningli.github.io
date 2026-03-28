// ============================================
// Cloudflare Worker — Anthropic API Proxy
// Deploy this at Cloudflare Workers to keep
// your API key off the client side.
// ============================================

// Set your Anthropic API key in Cloudflare Worker Environment Variables
// as ANTHROPIC_API_KEY

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};

// ============================================
// USAGE:
// 1. Create a Cloudflare Worker at workers.cloudflare.com
// 2. Paste this code
// 3. Add ANTHROPIC_API_KEY as an environment variable
// 4. In js/chat.js, replace the API URL with your worker URL:
//    fetch('https://your-worker.your-subdomain.workers.dev', ...)
// ============================================
