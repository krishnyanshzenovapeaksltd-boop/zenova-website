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
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
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

// ================= ORIGINAL PERFECT ALTRA AI =================
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

  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-latest', 'gemini-3.5-flash', 'gemini-3.5-flash-8b'];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
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
        console.log(`❌ Model ${model} failed: ${data.error.message}`);
        continue;
      }
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText || aiText.trim() === '') continue;
      if (!aiText.toLowerCase().includes('altraai for everything')) {
        aiText = `I am AltraAI for everything - ask anything! 😊\n\n${aiText}`;
      }
      console.log(`✅ AltraAI SUCCESS with ${model}`);
      return res.json({ reply: aiText });
    } catch (err) {
      console.log(`❌ Model ${model} exception: ${err.message}`);
    }
  }
  return res.json({
    reply: `I am AltraAI for everything - ask anything! 😊 I'm having a temporary connection issue. What business help do you need today?`
  });
});

// ================= NEW: ZENOVA WEBSITE BOT - WIRED TO RENDER ENV =================
app.post('/api/gemini', async (req, res) => {
  const userMessage = (req.body.message || '').toString().slice(0, 2000);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.json({ reply: "AI key not set in Render. Please add GEMINI_API_KEY in Environment." });
  }
  const systemPrompt = `You are Zenova AI Assistant for Krishnyansh Zenova Peaks Ltd RC-9810296 Lagos. CEO Ruby Garg +2349067862223. Services: CAC BN 60K LTD 150K NGO 220K, SMEDAN 10K SCUML/TIN 15K, Branding from 50K, Website 120K-550K, AltraAI Starter 55K+10K/mo Premium 85K+15K/mo Pro 150K+20K/mo, GBP 35K, Google Ads 70K/mo, AI Video 15K/ad. Be short, friendly Nigerian, ask business name + phone for lead. User: ${userMessage}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });
    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Thanks! WhatsApp us +2349067862223";
    console.log(`✅ Zenova Website Bot | User: ${userMessage.slice(0,40)}`);
    return res.json({ reply: aiText });
  } catch (err) {
    return res.json({ reply: `Thanks! We got your message. Our team will reply fast. WhatsApp +2349067862223` });
  }
});

// ================= NEW: SAVE LEADS TO SUPABASE =================
app.post('/api/zenova-lead', async (req, res) => {
  try {
    const { business_name, service, raw } = req.body;
    console.log('Zenova Lead:', business_name, service);
    if (supabase) {
      await supabase.from('contacts').insert([{ 
        name: business_name, 
        email: `${business_name}@lead.com`, 
        message: `${service} | ${raw}`, 
        service: service,
        created_at: new Date().toISOString() 
      }]);
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// ========== ADMIN LOCK ==========
function checkAdmin(req, res, next) {
  const adminPass = process.env.ADMIN_PASSWORD || 'Zenova@2026';
  const sentPass = req.headers['x-admin-password'] || req.query.admin_key || req.body.admin_key;
  if (sentPass === adminPass) return next();
  if (req.method === 'POST') return next();
  return res.status(401).json({ error: '🔒 Admin Locked' });
}

app.use('/api/contacts', (req, res, next) => { if(req.method==='GET') return checkAdmin(req,res,next); next(); });
app.use('/api/orders', (req, res, next) => { if(req.method==='GET') return checkAdmin(req,res,next); next(); });
app.use('/api/subscribers', checkAdmin);

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message, service } = req.body;
    if (supabase) {
      await supabase.from('contacts').insert([{ name, email, phone, message, service, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  } catch (err) { res.json([]); }
});

app.post('/api/orders', async (req, res) => {
  try {
    if (supabase) {
      await supabase.from('orders').insert([{...req.body, created_at: new Date().toISOString(), status: 'pending' }]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    res.json(data || []);
  } catch (err) { res.json([]); }
});

app.post('/api/cart', async (req, res) => { res.json({ success: true }); });

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (supabase) {
      await supabase.from('subscribers').insert([{ email, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});

app.get('/api/subscribers', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('subscribers').select('*').limit(200);
    res.json(data || []);
  } catch (err) { res.json([]); }
});

app.get('*', (req, res) => {
  if (frontendIndex && fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  const fallbackIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(fallbackIndex)) {
    return res.sendFile(fallbackIndex);
  }
  res.status(200).send(`<h1>Krishnyansh Zenova Peaks Ltd RC 9810296</h1>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`ORIGINAL ALTRA AI LIVE + /api/gemini WIRED`);
  console.log(`Port: ${PORT} | Gemini: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`===============================================`);
});
