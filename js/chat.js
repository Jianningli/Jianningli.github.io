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

// ── Knowledge base injected into the system prompt ───────────────────────────
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

// ── Conversation history ──────────────────────────────────────────────────────
let conversationHistory = [];

// ── Safety settings — relax defaults so the assistant response is not blocked ─
// BLOCK_ONLY_HIGH (value "BLOCK_LOW_AND_ABOVE" is the strictest; we want lenient)
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_ONLY_HIGH' },
];

// ── DOM helpers ───────────────────────────────────────────────────────────────
function getChatElements() {
  return {
    toggle   : document.getElementById('chat-toggle'),
    window   : document.getElementById('chat-window'),
    messages : document.getElementById('chat-messages'),
    input    : document.getElementById('chat-input'),
    send     : document.getElementById('chat-send'),
    close    : document.getElementById('chat-close'),
  };
}

// ── Render a message bubble ───────────────────────────────────────────────────
function appendMessage(role, text) {
  const { messages } = getChatElements();
  if (!messages) return;

  const wrapper = document.createElement('div');
  wrapper.className = `chat-message chat-message--${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function showTyping() {
  const { messages } = getChatElements();
  if (!messages) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message--assistant';
  wrapper.id = 'typing-indicator';
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble--typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Call the Gemini API ───────────────────────────────────────────────────────
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

  // Log full response in browser console to help with debugging
  console.log('[chat.js] Gemini raw response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data?.error?.message || `HTTP ${response.status}`);
  }

  // Check if the prompt itself was blocked before any candidate was generated
  if (data?.promptFeedback?.blockReason) {
    throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}`);
  }

  const candidate = data?.candidates?.[0];

  // Check if the candidate was blocked by safety filters
  if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
    console.warn('[chat.js] Candidate blocked, finishReason:', candidate.finishReason);
    return "I wasn't able to generate a response for that. You're welcome to email Jianning directly at jianningli.me@gmail.com!";
  }

  const assistantText = candidate?.content?.parts?.[0]?.text ?? '';

  if (!assistantText) {
    console.warn('[chat.js] Empty text in response:', data);
    return "I didn't get a response there. Please try rephrasing, or email Jianning at jianningli.me@gmail.com!";
  }

  // Append assistant turn to history for multi-turn context
  conversationHistory.push({ role: 'model', parts: [{ text: assistantText }] });

  return assistantText;
}

// ── Handle send ───────────────────────────────────────────────────────────────
async function handleSend() {
  const { input, send } = getChatElements();
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  send.disabled = true;

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
    send.disabled = false;
    input.focus();
  }
}

// ── Initialise the widget ─────────────────────────────────────────────────────
function initChat() {
  const { toggle, window: chatWin, input, send, close } = getChatElements();

  if (!toggle || !chatWin) {
    console.warn('[chat.js] Chat DOM elements not found.');
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = chatWin.classList.toggle('chat-window--open');
    toggle.setAttribute('aria-expanded', isOpen);
    if (isOpen && input) input.focus();
  });

  if (close) {
    close.addEventListener('click', () => {
      chatWin.classList.remove('chat-window--open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  if (send) send.addEventListener('click', handleSend);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  let greeted = false;
  toggle.addEventListener('click', () => {
    if (!greeted && chatWin.classList.contains('chat-window--open')) {
      greeted = true;
      setTimeout(() => {
        appendMessage(
          'assistant',
          "Hi! I'm Jianning's AI assistant. Ask me about his research, publications, or how to get in touch!"
        );
      }, 300);
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}
