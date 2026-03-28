// ============================================
// CHAT.JS — AI Assistant powered by Anthropic API
// Behaves like a RAG system over website content
// ============================================

// ---- Knowledge base about Jianning Li ----
const KNOWLEDGE_BASE = `
You are an AI assistant for Dr. Jianning Li's personal academic website. 
Answer questions about him based ONLY on the following information. Be warm, concise, and informative.
If something is not in the knowledge base, say so politely. Never make up information.

=== ABOUT JIANNING LI ===
Name: Jianning Li
Role: Researcher
Email: jianningli.me@gmail.com
Website: https://jianningli.me
GitHub: https://github.com/Jianningli
Google Scholar: https://scholar.google.com/citations?user=qPPTM_AAAAAJ

=== EDUCATION ===
- Ph.D. in Computer Science (with distinction)
- M.S. in Computer Science (with distinction)  
- B.S. in Biomedical Engineering (with distinction)

=== RESEARCH INTERESTS ===
- Medical Image Analysis
- Computer Vision
- Deep Learning (interpretable deep learning, disentangled representation learning, deep generative models)
- Artificial Intelligence in Healthcare
- Mathematical vision and neural models

=== RESEARCH OVERVIEW ===
Jianning's research lies at the intersection of computer vision, machine learning, and medical image analysis. 
He develops computational methods for analyzing medical images including CT scans and dental imaging, 
with a focus on segmentation, morphological analysis, and clinical translation.

=== RECENT PUBLICATIONS ===
- Cover Story in Dentistry Journal (Volume 13, Issue 12): A review on computational methods reshaping 
  root canal treatment — covering canal segmentation, high-resolution imaging, data-driven morphological 
  analysis and predictive modeling. Highlights a digital workflow enhancing diagnostic accuracy and treatment planning.
- Research on skull reconstruction, brain tumor segmentation, and cranial defect assessment.
- Work on automated tooth segmentation and dental landmark detection.

=== PROFESSIONAL SERVICES ===
- Reviewer for top-tier medical image analysis and computer vision venues (MICCAI, MedIA, ISBI, etc.)
- Organizer/contributor to medical image analysis challenges and workshops

=== THESIS & COLLABORATION ===
- Offers Master's thesis topics in medical image analysis and deep learning
- Open to collaborations on papers and grants
- Interested in discussing research ideas

=== TALKS & PRESENTATIONS ===
- Has presented research at international conferences in medical imaging and AI

=== TEACHING ===
- Teaching and supervising students at university level in computer science and AI topics

=== BOOKS / PROCEEDINGS ===
- Edited proceedings and books related to medical image analysis challenges

Respond in a friendly, professional tone. Keep responses concise (2-4 sentences max unless a list is needed). 
When the user asks about topics not in the knowledge base, say: "That's not covered on my website yet, but feel free to email Jianning at jianningli.me@gmail.com!"
`;

const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');

let conversationHistory = [];

function appendMessage(role, text) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? 'You' : 'JL';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return wrapper;
}

function appendTyping() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message bot-message';
  wrapper.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = 'JL';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble typing-bubble';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return wrapper;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  appendMessage('user', text);

  conversationHistory.push({ role: 'user', content: text });

  const typingEl = appendTyping();

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: KNOWLEDGE_BASE,
        messages: conversationHistory
      })
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || "I'm having trouble responding right now. Please try again!";

    typingEl.remove();
    appendMessage('bot', reply);
    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    typingEl.remove();
    appendMessage('bot', "Hmm, I'm offline right now. Feel free to email Jianning directly at jianningli.me@gmail.com!");
    console.error('Chat error:', err);
  }
}

function sendSuggestion(btn) {
  chatInput.value = btn.textContent;
  sendMessage();
  // Hide suggestions after first use
  document.querySelector('.chat-suggestions').style.display = 'none';
}

// Send on Enter
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
