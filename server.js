const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================= FRONTEND - ORIGINAL FULL =================
let frontendPath = null;
let frontendIndex = null;
const possiblePaths = [
  'public',
  'build',
  'dist',
  'frontend/build',
  'client/build',
  'frontend/dist',
  ''
];

for (const p of possiblePaths) {
  const fullPath = path.join(__dirname, p);
  const indexFile = path.join(fullPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    frontendPath = fullPath;
    frontendIndex = indexFile;
    console.log(`✅ Frontend found: ${fullPath}`);
    break;
  }
}

if (frontendPath) {
  app.use(express.static(frontendPath));
} else {
  console.log('⚠️ No frontend build found, using fallback');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey? createClient(supabaseUrl, supabaseKey) : null;
if (supabase) console.log('✅ Supabase connected');
else console.log('⚠️ Supabase not configured');

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    altraai: 'I am AltraAI for everything - ask anything!',
    frontend: frontendPath? 'found' : 'not found',
    frontendPath: frontendPath,
    gemini:!!process.env.GEMINI_API_KEY,
    supabase:!!supabase,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (req,res)=>{
  res.json({
    bank: { name: process.env.BANK_NAME||"GTB", account: process.env.BANK_ACCOUNT_NUMBER||"0123456789", accountName: process.env.BANK_ACCOUNT_NAME||"Krishnyansh Zenova Peaks Ltd" },
    flutterwave: { publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY||"", paymentLink: "Pay with Flutterwave Enabled" },
    rc: "9810296", bn: "9701468"
  });
});

app.get('/api/debug-gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: 'No GEMINI_API_KEY in env' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] })
    });
    const d = await r.json();
    res.json({ success:!d.error, data: d });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ================= ORIGINAL PERFECT ALTRA AI - NEW UPDATED FOR AQ KEYS =================
app.post('/api/altra-ai-chat', async (req, res) => {
  const userMessage = (req.body.message || '').toString().slice(0, 3000);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  const systemPrompt = `You are AltraAI. You MUST start every reply with EXACTLY: I am AltraAI for everything - ask anything! 😊

IDENTITY:
- You are AltraAI, created by Krishnyansh Zenova Peaks Ltd, RC 9810296, Lagos Nigeria
- Founder: Ruby Garg
- Website: krishnyanshzenovapeaks.com
- You help with CAC registration, business automation, AI chatbots, websites, branding, marketing
- You can answer ANY question: who is modi, general knowledge, science, history, business - everything
- you will ask phone number and email address for-compney lead
- Style: Friendly, warm, professional, helpful, concise (under 220 words)
- Always end with a helpful question

USER ASKS: ${userMessage}

Now answer as AltraAI:`;

  if (!apiKey) {
    return res.json({
      reply: `I am AltraAI for everything - ask anything! 😊 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. Please configure GEMINI_API_KEY in Render Environment to enable my full AI power. Meanwhile, how can I help with CAC registration or website?`
    });
  }

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-8b', 'gemini-3.5-flash-latest'];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey // NEW 2026: AQ keys require header, not?key=
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
            topP: 0.9
          }
        })
      });

      const data = await response.json();

      if (data.error) {
        console.log(`❌ Model ${model} failed: ${data.error.message} | Code: ${data.error.code}`);
        continue;
      }

      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText || aiText.trim() === '') {
        console.log(`❌ Model ${model} empty response`);
        continue;
      }

      if (!aiText.toLowerCase().includes('altraai for everything')) {
        aiText = `I am AltraAI for everything - ask anything! 😊\n\n${aiText}`;
      }

      console.log(`✅ AltraAI SUCCESS with ${model} | User: ${userMessage.slice(0,30)}`);
      return res.json({ reply: aiText });

    } catch (err) {
      console.log(`❌ Model ${model} exception: ${err.message}`);
    }
  }

  console.log('❌ ALL GEMINI MODELS FAILED - Check billing & API enabled');
  return res.json({
    reply: `I am AltraAI for everything - ask anything! 😊 I'm having a temporary connection issue. Please make sure:you are connected with internet "! What business help do you need today?`
  });
});

// ========== ADMIN LOCK - NEW ==========
function checkAdmin(req, res, next) {
  const adminPass = process.env.ADMIN_PASSWORD || 'Zenova@2026';
  const sentPass = req.headers['x-admin-password'] || req.query.admin_key || req.body.admin_key;
  
  // Allow if password matches OR if you are checking from your own admin page with key
  if (sentPass === adminPass) {
    return next();
  }
  // For public contact form, allow POST but not GET
  if (req.method === 'POST') return next();
  
  return res.status(401).json({ error: '🔒 Admin Locked - Add ?admin_key=YOUR_PASSWORD or x-admin-password header' });
}

// Protect all admin GET routes
app.use('/api/contacts', (req, res, next) => { if(req.method==='GET') return checkAdmin(req,res,next); next(); });
app.use('/api/orders', (req, res, next) => { if(req.method==='GET') return checkAdmin(req,res,next); next(); });
app.use('/api/subscribers', checkAdmin);
// ================= CONTACTS - ORIGINAL =================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message, service } = req.body;
    console.log('Contact:', name, email);
    if (supabase) {
      await supabase.from('contacts').insert([{ name, email, phone, message, service, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true, message: 'Message received' });
  } catch (err) {
    console.log('Contact error:', err.message);
    res.json({ success: true });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// ================= ORDERS - ORIGINAL =================
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Order:', req.body);
    if (supabase) {
      await supabase.from('orders').insert([{...req.body, created_at: new Date().toISOString(), status: 'pending' }]);
    }
    res.json({ success: true, message: 'Order received' });
  } catch (err) {
    console.log('Order error:', err.message);
    res.json({ success: true });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// ================= CART - ORIGINAL =================
app.post('/api/cart', async (req, res) => {
  try {
    console.log('Cart:', req.body);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// ================= SUBSCRIBE - ORIGINAL =================
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Subscribe:', email);
    if (supabase) {
      await supabase.from('subscribers').insert([{ email, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true, message: 'Subscribed' });
  } catch (err) {
    console.log('Subscribe error:', err.message);
    res.json({ success: true });
  }
});

app.get('/api/subscribers', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('subscribers').select('*').limit(200);
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// ================= FRONTEND CATCH ALL - ORIGINAL =================
app.get('*', (req, res) => {
  if (frontendIndex && fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  const fallbackIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(fallbackIndex)) {
    return res.sendFile(fallbackIndex);
  }
  res.status(200).send(`
    <!DOCTYPE html><html><head><title>Krishnyansh Zenova Peaks</title><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Arial;background:#f5f7fa;margin:0;padding:20px}.box{max-width:800px;margin:40px auto;background:white;padding:32px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.08)} input{width:65%;padding:14px;border:1px solid #ddd;border-radius:12px} button{padding:14px 22px;background:#000;color:#fff;border:0;border-radius:12px;margin-left:8px;cursor:pointer} #reply{margin-top:20px;white-space:pre-wrap;background:#f8f9fa;padding:18px;border-radius:12px;text-align:left;line-height:1.6}</style>
    </head><body><div class="box"><h1>Krishnyansh Zenova Peaks Ltd</h1><h3>RC 9810296 | I am AltraAI for everything - ask anything! 😊</h3><div><input id="q" placeholder="Ask anything - <button onclick="ask()">Ask AltraAI</button></div><div id="reply">hi ! I am AltraAI for everything - ask anything! How can I help?</div></div>
    <script>async function ask(){const v=document.getElementById('q').value; if(!v)return; document.getElementById('reply').innerText='AltraAI thinking...'; const r=await fetch('/api/altra-ai-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:v})}); const d=await r.json(); document.getElementById('reply').innerText=d.reply;}</script></body></html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`ORIGINAL ALTRA AI LIVE - I am AltraAI for everything`);
  console.log(`Port: ${PORT} | Frontend: ${frontendPath || 'fallback'}`);
  console.log(`Gemini: ${!!process.env.GEMINI_API_KEY} | Supabase: ${!!supabase}`);
  console.log(`===============================================`);
});
