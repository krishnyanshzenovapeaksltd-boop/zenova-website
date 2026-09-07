const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// FIND FRONTEND FOLDER - AUTOMATIC
let frontendPath = null;
let frontendIndex = null;
const folders = ['public', 'build', 'dist', 'frontend/build', 'frontend/dist', 'client/build', ''];
for (const f of folders) {
  const p = path.join(__dirname, f);
  const idx = path.join(p, 'index.html');
  if (fs.existsSync(idx)) {
    frontendPath = p;
    frontendIndex = idx;
    console.log('Frontend found:', p);
    break;
  }
}
if (frontendPath) {
  app.use(express.static(frontendPath));
}

// SUPABASE
const supabase = process.env.SUPABASE_URL ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY) : null;

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    altraai: 'I am AltraAI for everything - ask anything!',
    frontend: frontendPath || 'No frontend folder - showing fallback page - add index.html to public/',
    gemini: !!process.env.GEMINI_API_KEY,
    supabase: !!supabase
  });
});

// ALTRA AI CHAT - COMPLETE - SUPPORTS AQ KEYS - gemini-1.5-flash
app.post('/api/altra-ai-chat', async (req, res) => {
  try {
    const userMsg = (req.body.message || 'hello').toString().slice(0, 2000);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ reply: "I am AltraAI for everything - ask anything! 😊👋 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. Add GEMINI_API_KEY in Render to enable real AI." });
    }

    const prompt = `You are AltraAI. Core identity line you must include: "I am AltraAI for everything - ask anything!" Founder: Ruby Garg, Krishnyansh Zenova Peaks Ltd RC 9810296, Lagos Nigeria. Business: CAC registration, business automation, AI chatbots, websites, branding. Style: Friendly, helpful, concise under 150 words, professional. User message: ${userMsg}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty AI response');

      if (!text.toLowerCase().includes('altraai for everything')) {
        text = `I am AltraAI for everything - ask anything! 😊\n\n${text}`;
      }

      return res.json({ reply: text });

    } catch (err) {
      console.log('Gemini error:', err.message);
      return res.json({ reply: `I am AltraAI for everything - ask anything! 😊👋 You said "${userMsg}". I'm here for CAC, automation, websites, AI bots, branding - just ask anything! (AI busy 20 sec - try again)` });
    }

  } catch (e) {
    res.json({ reply: "I am AltraAI for everything - ask anything! 😊 How can I help your business today?" });
  }
});

// CONTACTS
app.post('/api/contact', async (req, res) => {
  try {
    if (supabase) await supabase.from('contacts').insert([{ ...req.body, created_at: new Date().toISOString() }]);
    res.json({ success: true, message: 'Saved' });
  } catch (e) { res.json({ success: true }); }
});
app.get('/api/contacts', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

// ORDERS
app.post('/api/orders', async (req, res) => {
  try {
    if (supabase) await supabase.from('orders').insert([{ ...req.body, created_at: new Date().toISOString() }]);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});
app.get('/api/orders', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

// CART
app.post('/api/cart', async (req, res) => {
  try {
    if (supabase) await supabase.from('cart').insert([{ ...req.body, created_at: new Date().toISOString() }]);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

// SUBSCRIBE
app.post('/api/subscribe', async (req, res) => {
  try {
    if (supabase) await supabase.from('subscribers').insert([{ email: req.body.email, created_at: new Date().toISOString() }]);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

// FRONTEND - NEVER SHOWS NOT FOUND AGAIN
app.get('*', (req, res) => {
  if (frontendIndex && fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  // Fallback page if no public/index.html in GitHub - This prevents Not Found
  return res.send(`
    <html><head><title>Krishnyansh Zenova Peaks - AltraAI</title><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Arial;background:#f5f5f7;margin:0;padding:20px} .card{max-width:700px;margin:30px auto;background:white;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08)} input{width:70%;padding:14px;border:1px solid #ddd;border-radius:10px} button{padding:14px 22px;background:#111;color:white;border:none;border-radius:10px;margin-left:8px;cursor:pointer} #reply{margin-top:20px;background:#f9f9f9;padding:16px;border-radius:10px;white-space:pre-wrap;text-align:left}</style>
    </head><body><div class="card">
    <h1>Krishnyansh Zenova Peaks Ltd</h1>
    <h2>I am AltraAI for everything - ask anything! 😊</h2>
    <p>Backend LIVE ✅ | Frontend file not found in GitHub public/ folder - Add your index.html to show your design</p>
    <p><a href="/api/health">Check API Health</a></p>
    <div><input id="msg" placeholder="Type anything... e.g. CAC price"><button onclick="ask()">Ask AltraAI</button></div>
    <div id="reply">Ask me anything about CAC, business, website, AI bots...</div>
    </div><script>async function ask(){const m=document.getElementById('msg').value; if(!m)return; document.getElementById('reply').innerText='AltraAI thinking...'; const r=await fetch('/api/altra-ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m})}); const d=await r.json(); document.getElementById('reply').innerText=d.reply;}</script>
    </body></html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('COMPLETE SERVER LIVE on ' + PORT + ' - I am AltraAI for everything'));
