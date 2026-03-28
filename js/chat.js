/* =============================================================
   chat.js — AI Chat Widget for Jianning Li's Academic Website
   =============================================================

   HOW TO MAKE THE CHAT WORK (FREE — no credit card needed)
   ---------------------------------------------------------
   1. Go to https://aistudio.google.com and sign in with Google.
   2. Click "Get API key" → "Create API key".
   3. Paste it below where it says YOUR_GEMINI_API_KEY_HERE.
   4. Save and push to GitHub — the chatbot will be live.
   ============================================================= */

const API_KEY = 'AIzaSyCMAhdH2lVYO2Y_pAah2_ZUJqt_hw_6FzU';  // ← paste your key here
const MODEL   = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const KNOWLEDGE_BASE = `
You are a friendly AI assistant on Jianning Li's personal academic website.
Answer questions about Jianning concisely and helpfully.
If you do not know something specific, say so and invite the visitor to email him.

About Jianning Li:
Jianning Li is a researcher in medical image analysis, deep learning, and 3D reconstruction of anatomical structures.

Contact: jianningli.me@gmail.com
GitHub: https://github.com/Jianningli
Website: https://jianningli.github.io

Research areas include medical image segmentation, deep learning for computer-aided diagnosis, skull reconstruction, cranial implant design, 3D shape modelling, and AI-assisted surgical planning.

Notable work includes automated cranial implant design contributing to MICCAI AutoImplant challenges, brain tumour segmentation, and shape completion research.

Jianning has been affiliated with research institutions in Europe working at the intersection of computer vision, medical imaging, and machine learning.

He is open to research collaborations and happy to discuss his published work.

Keep answers to 2-4 sentences. For publications, suggest checking Google Scholar. For collaborations, encourage emailing jianningli.me@gmail.com.
`;

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

let conversationHistory = [];

// ── API ───────────────────────────────────────────────────────────────────────
async function callGemini(userMessage) {
  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const response = await fetch(API_URL, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      system_instruction: { parts: [{ text: KNOWLEDGE_BASE }] },
      contents          : conversationHistory,
      safetySettings    : SAFETY_SETTINGS,
      generationConfig  : { maxOutputTokens: 512, temperature: 0.7 },
    }),
  });

  const data = await response.json();
  console.log('[chat.js] Gemini response:', JSON.stringify(data, null, 2));

  if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
  if (data?.promptFeedback?.blockReason) throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);

  const candidate    = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
    return "I wasn't able to generate a response for that. You're welcome to email Jianning at jianningli.me@gmail.com!";
  }

  const text = candidate?.content?.parts?.[0]?.text ?? '';
  if (!text) return "I didn't get a response. Please try rephrasing, or email Jianning at jianningli.me@gmail.com!";

  conversationHistory.push({ role: 'model', parts: [{ text }] });
  return text;
}

// ── DOM ───────────────────────────────────────────────────────────────────────
function appendMessage(role, text) {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  const wrap = document.createElement('div');
  wrap.className = role === 'user' ? 'message user-message' : 'message bot-message';
  if (role === 'assistant') {
    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.textContent = 'JL';
    wrap.appendChild(av);
  }
  const bub = document.createElement('div');
  bub.className = 'msg-bubble';
  bub.textContent = text;
  wrap.appendChild(bub);
  win.appendChild(wrap);
  win.scrollTop = win.scrollHeight;
}

function showTyping() {
  const win = document.getElementById('chatWindow');
  if (!win) return;
  const wrap = document.createElement('div');
  wrap.className = 'message bot-message';
  wrap.id = 'typing-indicator';
  wrap.innerHTML = '<div class="msg-avatar">JL</div><div class="msg-bubble"><em style="opacity:0.6">Typing\u2026</em></div>';
  win.appendChild(wrap);
  win.scrollTop = win.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Core send ─────────────────────────────────────────────────────────────────
async function doSend(text) {
  text = (text || '').trim();
  if (!text) return;

  const btn   = document.getElementById('sendBtn');
  const input = document.getElementById('chatInput');
  if (btn)   btn.disabled = true;
  if (input) input.value  = '';

  appendMessage('user', text);
  showTyping();

  try {
    if (!API_KEY || API_KEY === 'AIzaSyCMAhdH2lVYO2Y_pAah2_ZUJqt_hw_6FzU') {
      throw new Error('No API key — open js/chat.js and paste your key from aistudio.google.com.');
    }
    const reply = await callGemini(text);
    hideTyping();
    appendMessage('assistant', reply);
  } catch (err) {
    hideTyping();
    console.error('[chat.js]', err);
    appendMessage('assistant',
      err.message.startsWith('No API key')
        ? '\u2699\uFE0F ' + err.message
        : 'Something went wrong. Feel free to email Jianning at jianningli.me@gmail.com!');
  } finally {
    if (btn)   btn.disabled = false;
    if (input) input.focus();
  }
}

// ── Overwrite the stub functions defined in index.html with real ones ─────────
window.sendMessage   = function ()    { doSend(document.getElementById('chatInput')?.value); };
window.sendSuggestion = function (btn) { doSend(btn?.textContent); };

// ── Enter key ─────────────────────────────────────────────────────────────────
const _input = document.getElementById('chatInput');
if (_input) {
  _input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(_input.value); }
  });
  console.log('[chat.js] ready. Enter key listener attached.');
} else {
  console.error('[chat.js] #chatInput not found — check your HTML IDs.');
}
