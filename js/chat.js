/* =============================================================
   chat.js — AI Chat Widget for Jianning Li's Academic Website
   =============================================================

   HOW TO MAKE THE CHAT WORK
   --------------------------
   1. Go to https://console.anthropic.com/ and create an API key.
   2. Paste it below where it says  YOUR_ANTHROPIC_API_KEY_HERE
   3. Save the file and push to GitHub — the chatbot will be live.

   Note: Exposing an API key in a public GitHub repo lets anyone
   run up charges on your account. For a public site, consider
   wrapping the key in a tiny Cloudflare Worker proxy (see
   proxy/worker.js) and pointing API_URL at your worker instead.
   ============================================================= */

// Replace these constants at the top of chat.js:

const API_KEY = 'AIzaSyCMAhdH2lVYO2Y_pAah2_ZUJqt_hw_6FzU';  // from aistudio.google.com
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AIzaSyCMAhdH2lVYO2Y_pAah2_ZUJqt_hw_6FzU}`;
const MODEL   = 'gemini-2.5-flash';          // fast, free, capable

// ── Knowledge base injected into the system prompt ───────────────────────────
const KNOWLEDGE_BASE = `
You are an AI assistant on Jianning Li's personal academic website.
Answer questions about Jianning concisely, helpfully, and in the first or
third person as appropriate. If you don't know something specific, say so
honestly and invite the visitor to email him directly.

=== ABOUT JIANNING LI ===
Jianning Li (李建宁) is a researcher specialising in medical image analysis,
deep learning, and 3-D reconstruction of anatomical structures.

Contact & links
  Email  : jianningli.me@gmail.com
  GitHub : https://github.com/Jianningli
  Website: https://jianningli.github.io

Research interests
  • Medical image segmentation and reconstruction
  • Deep learning for computer-aided diagnosis
  • Skull reconstruction / cranial implant design
  • 3-D shape modelling of biological structures
  • AI-assisted surgical planning

Selected publications & projects
  • Work on automated cranial implant design using deep learning,
    contributing to MICCAI challenges (AutoImplant series).
  • Research on brain tumour segmentation.
  • Studies on shape completion and volumetric mesh generation.

Academic background
  Jianning has been affiliated with research institutions in Europe,
  working at the intersection of computer vision, medical imaging, and
  machine learning.

Personality / working style
  Jianning is collaborative, open to interdisciplinary work, and happy
  to discuss potential research collaborations or answer questions about
  his published work.

=== GUIDANCE FOR RESPONSES ===
  • Keep answers brief (2–4 sentences) unless the visitor asks for detail.
  • For publication details, suggest checking Google Scholar or the website.
  • For collaboration inquiries, encourage emailing jianningli.me@gmail.com.
  • Do not invent publication titles, dates, or affiliations you are unsure of.
`;

// ── Conversation history (kept in memory for the session) ────────────────────
let conversationHistory = [];

// ── DOM helpers ──────────────────────────────────────────────────────────────
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

// ── Typing indicator ─────────────────────────────────────────────────────────
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

// ── Call the Anthropic API ────────────────────────────────────────────────────
async function callAnthropic(userMessage) {
  conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const payload = {
    system_instruction: { parts: [{ text: KNOWLEDGE_BASE }] },
    contents: conversationHistory,
    generationConfig: { maxOutputTokens: 512 }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const assistantText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

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
    // Guard: if the placeholder key is still there, show a helpful error
    if (!API_KEY || API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
      throw new Error(
        'No API key configured. Open js/chat.js and paste your Anthropic API key.'
      );
    }

    const reply = await callAnthropic(text);
    hideTyping();
    appendMessage('assistant', reply);
  } catch (err) {
    hideTyping();
    console.error('[chat.js] API error:', err);
    appendMessage(
      'assistant',
      err.message.startsWith('No API key')
        ? '⚙️ ' + err.message
        : "Hmm, something went wrong on my end. Feel free to email Jianning directly at jianningli.me@gmail.com!"
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
    console.warn('[chat.js] Chat elements not found in DOM.');
    return;
  }

  // Open / close toggle
  toggle.addEventListener('click', () => {
    const isOpen = chatWin.classList.toggle('chat-window--open');
    toggle.setAttribute('aria-expanded', isOpen);
    if (isOpen && input) input.focus();
  });

  // Close button inside the window
  if (close) {
    close.addEventListener('click', () => {
      chatWin.classList.remove('chat-window--open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Send button
  if (send) send.addEventListener('click', handleSend);

  // Enter key in input (Shift+Enter = newline)
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  // Greeting on first open
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
