# Jianning Li — Personal Academic Website

A personal academic website with an AI-powered chat assistant, interactive 3D visualization, and full portfolio sections.

## 🚀 Quick Start (GitHub Pages)

### Step 1 — Upload your photo
Replace `assets/photo.jpg` with your actual profile photo (square format works best).

### Step 2 — Add your API key
The chat feature uses the Anthropic API. You need to add your API key so the chat widget works.

**Option A — Quick (for testing only):**
In `js/chat.js`, find the `fetch` call and add your key to headers:
```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_ANTHROPIC_API_KEY',  // ← add this
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

**Option B — Recommended (production):**
Deploy a tiny backend proxy (Cloudflare Worker, Vercel Edge Function, or any server) that forwards requests to Anthropic. Point `js/chat.js` at your proxy URL instead of `https://api.anthropic.com/v1/messages`.

A minimal Cloudflare Worker example is included in `proxy/worker.js`.

### Step 3 — Deploy to GitHub Pages
1. Create a new GitHub repository (e.g., `yourusername.github.io`)
2. Upload all files from this folder to the repository
3. Go to Settings → Pages → Set source to `main` branch, root `/`
4. Your site will be live at `https://yourusername.github.io`

---

## 📁 File Structure

```
/
├── index.html          ← Landing page with chat
├── main.html           ← Full portfolio
├── css/
│   ├── landing.css     ← Landing page styles
│   └── main.css        ← Portfolio styles
├── js/
│   ├── chat.js         ← AI chat widget
│   ├── landing.js      ← Landing animations
│   ├── main.js         ← Portfolio nav & scroll
│   └── three-model.js  ← 3D interactive model
├── assets/
│   ├── photo.jpg       ← Your photo (replace!)
│   ├── scholar.svg     ← Google Scholar icon
│   ├── github.svg      ← GitHub icon
│   └── cv.pdf          ← Your CV (add this!)
└── proxy/
    └── worker.js       ← Cloudflare Worker proxy (optional)
```

## ✏️ Customizing Content

All text content is in `index.html` and `main.html`. Edit directly:

- **Overview text**: `main.html` → section `#overview`
- **Biography**: `main.html` → section `#biography`
- **Publications**: `main.html` → section `#publications`
- **Projects**: `main.html` → section `#projects`
- **Chat knowledge base**: `js/chat.js` → `KNOWLEDGE_BASE` constant

## 🎨 Design

- **Font**: Cormorant Garamond (display) + DM Mono (body) + Syne (UI)
- **Theme**: Dark academic — deep ink backgrounds, warm gold accents
- **3D**: Three.js interactive models (Brain, DNA, Torus Knot)
- **Chat**: Anthropic Claude API with curated knowledge base

## 📱 Responsive

Fully responsive — sidebar collapses to hamburger on mobile, all grids reflow.
