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
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${AIzaSyCMAhdH2lVYO2Y_pAah2_ZUJqt_hw_6FzU}`;

// ── Knowledge base ────────────────────────────────────────────────────────────
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

// ── Safety settings ───────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

// ── Conversation history ──────────────────────────────────────────────────────
let conversationHistory = [];

// ── DOM references (matching the actual IDs in index.html) ────────────────────
// chatWindow  → the scrollable message list
// chatInput   → the text input
// sendBtn     → the send button
// The send button also has onclick="sendMessage()" inline in the HTML,
// and suggestion chips have onclick="sendSuggestion(this)" — both are
// defined as globals below.

function getChatWindow()  { return document.getElementById('chatWindow'); }
function getChatInput()   { return document.getElementById('chatInput'); }
function getSendBtn()     { return document.getElementById('sendBtn'); }

// ── Append a message bubble ───────────────────────────────────────────────────
function appendMessage(role, text) {
  const chatWindow = getChatWindow();
  if (!chatWindow) return;

  const wrapper = document.createElement('div');
  wrapper.className = role === 'user' ? 'message user-message' : 'message bot-message';

  if (role === 'assistant') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = 'JL';
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function showTyping() {
  const chatWindow = getChatWindow();
  if (!chatWindow) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'message bot-message';
  wrapper.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = 'JL';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = '<em style="opacity:0.6">Typing…</em>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Gemini API call ───────────────────────────────────────────────────────────
async function callGemini(userMessage) {
  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const payload = {
    system_instruction: { parts: [{ text: KNOWLEDGE_BASE }] },
    contents          : conversationHistory,
    safetySettings    : SAFETY_SETTINGS,
    generationConfig  : { maxOutputTokens: 512, temperature: 0.7 },
  };

  const response = await fetch(API_URL, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(payload),
  });

  const data = await response.json();
  console.log('[chat.js] Gemini response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data?.error?.message || `HTTP ${response.status}`);
  }

  if (data?.promptFeedback?.blockReason) {
    throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}`);
  }

  const candidate = data?.candidates?.[0];

  if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
    console.warn('[chat.js] finishReason:', candidate.finishReason);
    return "I wasn't able to generate a response for that. You're welcome to email Jianning at jianningli.me@gmail.com!";
  }

  const assistantText = candidate?.content?.parts?.[0]?.text ?? '';

  if (!assistantText) {
    console.warn('[chat.js] Empty response body:', data);
    return "I didn't get a response. Please try rephrasing, or email Jianning at jianningli.me@gmail.com!";
  }

  conversationHistory.push({ role: 'model', parts: [{ text: assistantText }] });
  return assistantText;
}

// ── Core send logic ───────────────────────────────────────────────────────────
async function doSend(text) {
  text = (text || '').trim();
  if (!text) return;

  const sendBtn  = getSendBtn();
  const input    = getChatInput();

  if (sendBtn)  sendBtn.disabled = true;
  if (input)    input.value = '';

  appendMessage('user', text);
  showTyping();

  try {
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('No API key — open js/chat.js and paste your Gemini key from aistudio.google.com.');
    }

    const reply = await callGemini(text);
    hideTyping();
    appendMessage('assistant', reply);
  } catch (err) {
    hideTyping();
    console.error('[chat.js] Error:', err);
    appendMessage(
      'assistant',
      err.message.startsWith('No API key')
        ? '⚙️ ' + err.message
        : "Something went wrong. Feel free to email Jianning directly at jianningli.me@gmail.com!"
    );
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (input)   input.focus();
  }
}

// ── Global functions called by inline onclick handlers in index.html ──────────

// Called by: <button id="sendBtn" onclick="sendMessage()">
window.sendMessage = function () {
  const input = getChatInput();
  if (input) doSend(input.value);
};

// Called by: <button class="suggestion-chip" onclick="sendSuggestion(this)">
window.sendSuggestion = function (btn) {
  if (btn && btn.textContent) doSend(btn.textContent.trim());
};

// ── Enter key on the input ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const input = getChatInput();
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend(input.value);
      }
    });
  }
});
