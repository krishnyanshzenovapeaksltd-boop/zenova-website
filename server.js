const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// FIND FRONTEND - NO MORE NOT FOUND
let frontendPath = null;
let frontendIndex = null;
const possible = ['public', 'build', 'dist', 'frontend/build', ''];
for (const f of possible) {
  const p = path.join(__dirname, f);
  const idx = path.join(p, 'index.html');
  if (fs.existsSync(idx)) { frontendPath = p; frontendIndex = idx; console.log('Frontend:', p); break; }
}
if (frontendPath) app.use(express.static(frontendPath));

const supabase = process.env.SUPABASE_URL ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY) : null;

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', altraai: 'I am AltraAI for everything - ask anything!', frontend: frontendPath ? 'found' : 'fallback', gemini: !!process.env.GEMINI_API_KEY });
});

// ORIGINAL ALTRA AI - PERFECT WORKING BEFORE - SUPPORTS AQ KEYS
app.post('/api/altra-ai-chat', async (req, res) => {
  const userMsg = (req.body.message || 'Hello').toString().slice(0, 2000);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  const systemPrompt = `You are AltraAI. You MUST start every reply with: I am AltraAI for everything - ask anything! 😊

Identity: You are AltraAI created by Krishnyansh Zenova Peaks Ltd, RC 9810296, Lagos Nigeria. Founder Ruby Garg. You help with CAC registration, business automation, AI chatbots, websites, branding, marketing.

Style: Friendly, warm, professional, concise (under 180 words), helpful. Always end with question to help further.

User: ${userMsg}`;

  // If no key - original smart reply (no busy message)
  if (!apiKey) {
    return res.json({ reply: `I am AltraAI for everything - ask anything! 😊👋 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. I can help you with CAC business registration, website development, AI automation, branding & marketing. What would you like to know about your business today?` });
  }

  // Try models - supports AQ keys with x-goog-api-key header
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } })
      });

      const data = await r.json();
      if (data.error) { console.log(`Model ${model} error:`, data.error.message); continue; }

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) continue;

      // Ensure original line
      if (!text.toLowerCase().includes('altraai for everything')) {
        text = `I am AltraAI for everything - ask anything! 😊\n\n${text}`;
      }
      console.log(`AltraAI success with ${model}`);
      return res.json({ reply: text });

    } catch (e) { console.log(`Model ${model} fetch failed:`, e.message); continue; }
  }

  // ORIGINAL FALLBACK - Perfect like before (smart, not busy)
  const lower = userMsg.toLowerCase();
  let smart = '';
  if (lower.includes('cac') || lower.includes('business') || lower.includes('register')) smart = `For CAC registration, we handle Business Name (₦25k), Limited Company (₦85k), NGO. Includes name search, docs, TIN, SCUML if needed. 3-7 days delivery. Want to start?`;
  else if (lower.includes('website') || lower.includes('site')) smart = `We build professional websites - Business, E-commerce, Portfolio - Mobile friendly, fast, with admin panel & AltraAI chat like this. Starts from ₦150k. Want demo?`;
  else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) smart = `Our services: CAC from ₦25k, Website from ₦150k, AI Chatbot integration ₦50k, Branding + Logo ₦40k. Tell me what you need, I give exact quote!`;
  else smart = `I'm here to help with your business growth - CAC, website, automation, branding, marketing. Just tell me what you need today!`;

  return res.json({ reply: `I am AltraAI for everything - ask anything! 😊\n\n${smart}` });
});

// CONTACTS
app.post('/api/contact', async (req, res) => {
  try { if (supabase) await supabase.from('contacts').insert([{ ...req.body, created_at: new Date().toISOString() }]); res.json({ success: true }); }
  catch { res.json({ success: true }); }
});
app.get('/api/contacts', async (req, res) => {
  try { if (!supabase) return res.json([]); const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100); res.json(data || []); }
  catch { res.json([]); }
});

// ORDERS
app.post('/api/orders', async (req, res) => { try { if (supabase) await supabase.from('orders').insert([{ ...req.body, created_at: new Date().toISOString() }]); res.json({ success: true }); } catch { res.json({ success: true }); } });
app.get('/api/orders', async (req, res) => { try { if (!supabase) return res.json([]); const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200); res.json(data || []); } catch { res.json([]); } });

// CART & SUBSCRIBE
app.post('/api/cart', async (req, res) => { res.json({ success: true }); });
app.post('/api/subscribe', async (req, res) => { try { if (supabase) await supabase.from('subscribers').insert([{ email: req.body.email, created_at: new Date().toISOString() }]); res.json({ success: true }); } catch { res.json({ success: true }); } });

// FRONTEND - ORIGINAL - NO NOT FOUND
app.get('*', (req, res) => {
  if (frontendIndex && fs.existsSync(frontendIndex)) return res.sendFile(frontendIndex);
  return res.send(`
    <html><head><title>Zenova Peaks - AltraAI</title><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Arial;background:#f8f9fa;margin:0;padding:20px}.box{max-width:700px;margin:40px auto;background:white;padding:32px;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08)}input{width:68%;padding:14px;border:1px solid #ddd;border-radius:10px}button{padding:14px 20px;background:#111;color:#fff;border:0;border-radius:10px;margin-left:8px;cursor:pointer}#r{margin-top:20px;white-space:pre-wrap;background:#f6f6f6;padding:16px;border-radius:10px;text-align:left}</style>
    </head><body><div class="box"><h1>Krishnyansh Zenova Peaks Ltd</h1><h2>I am AltraAI for everything - ask anything! 😊</h2><p>RC 9810296 | Lagos | CAC | Websites | AI Automation</p><div><input id="m" placeholder="Ask about CAC, website, price..."><button onclick="ask()">Ask</button></div><div id="r">Hi! I am AltraAI - Ask me anything...</div></div>
    <script>async function ask(){const v=document.getElementById('m').value; if(!v)return; document.getElementById('r').innerText='AltraAI thinking...'; const res=await fetch('/api/altra-ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:v})}); const d=await res.json(); document.getElementById('r').innerText=d.reply;}</script></body></html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('ORIGINAL ALTRA AI LIVE - I am AltraAI for everything - Port ' + PORT));
