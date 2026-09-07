const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// HEALTH
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'I am AltraAI for everything - ask anything!', supabase: !!supabase, gemini: !!process.env.GEMINI_API_KEY });
});

// ============ ALTRA AI CHAT - FINAL - SUPPORTS AQ. KEYS - NO NPM PACKAGE NEEDED ============
app.post('/api/altra-ai-chat', async (req, res) => {
  try {
    const userMsg = (req.body.message || 'hello').toString().slice(0, 2000);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ reply: "I am AltraAI for everything - ask anything! 😊👋 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. How can I help your business today?" });
    }

    const systemPrompt = `You are AltraAI. Your core identity: "I am AltraAI for everything - ask anything!" Founder: Ruby Garg, Krishnyansh Zenova Peaks Ltd RC 9810296, Lagos Nigeria. You help with CAC registration, business automation, AI chatbots, websites, branding, fashion business. Be friendly, helpful, concise (under 150 words), professional, use emojis sparingly. Always make sure user knows you are AltraAI for everything. User says: ${userMsg}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty response');

      if (!text.toLowerCase().includes('altraai for everything')) {
        text = `I am AltraAI for everything - ask anything! 😊\n\n${text}`;
      }

      return res.json({ reply: text });

    } catch (e) {
      console.log('Gemini API error:', e.message);
      return res.json({ reply: `I am AltraAI for everything - ask anything! 😊👋 You said "${userMsg}". I'm here for CAC, business automation, websites, AI bots, branding - ask anything! (AI high demand 20 sec - please try again)` });
    }

  } catch (err) {
    res.json({ reply: "I am AltraAI for everything - ask anything! 😊 How can I help your business today?" });
  }
});

// ============ CONTACT ============
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    if (supabase) {
      await supabase.from('contacts').insert([{ name, email, message, phone, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true, message: 'Message received! We will contact you soon.' });
  } catch (e) { res.json({ success: true }); }
});
app.get('/api/contacts', async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  } catch (e) { res.json([]); }
});

// ============ ORDERS ============
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

// ============ CART & WISHLIST ============
app.post('/api/cart', async (req, res) => {
  try { if (supabase) await supabase.from('cart').insert([{ ...req.body, created_at: new Date().toISOString() }]); res.json({ success: true }); }
