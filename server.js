const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = process.env.SUPABASE_URL ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY) : null;

// HEALTH
app.get('/api/health', (req,res)=>{
  res.json({status:'ok', altraai:'I am AltraAI for everything - ask anything!', gemini: !!process.env.GEMINI_API_KEY});
});

// ALTRA AI CHAT - FIXED - WORKS WITH AQ. KEYS - NO NPM PACKAGE ERROR
app.post('/api/altra-ai-chat', async(req,res)=>{
  try{
    const userMsg = (req.body.message||'hello').toString().slice(0,2000);
    const apiKey = process.env.GEMINI_API_KEY;
    if(!apiKey){
      return res.json({reply:"I am AltraAI for everything - ask anything! 😊👋 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. How can I help?"});
    }
    const prompt = `You are AltraAI. Core identity: I am AltraAI for everything - ask anything! Founder Ruby Garg, Krishnyansh Zenova Peaks Ltd RC 9810296 Lagos. Help with CAC, automation, AI bots, website, branding. Be friendly, concise, professional. User: ${userMsg}`;
    try{
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,{
        method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
      });
      const d = await r.json();
      if(d.error) throw new Error(d.error.message);
      let text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if(!text) throw new Error('empty');
      if(!text.toLowerCase().includes('altraai for everything')){
        text = `I am AltraAI for everything - ask anything! 😊\n\n${text}`;
      }
      return res.json({reply:text});
    }catch(e){
      console.log('Gemini:',e.message);
      return res.json({reply:`I am AltraAI for everything - ask anything! 😊👋 You said "${userMsg}". I'm here for CAC, automation, website, bots, branding - ask anything! (Try again in 20 sec)`});
    }
  }catch(e){
    res.json({reply:"I am AltraAI for everything - ask anything! 😊 How can I help?"});
  }
});

// CONTACTS
app.post('/api/contact', async(req,res)=>{
  try{
    if(supabase) await supabase.from('contacts').insert([{...req.body, created_at:new Date().toISOString()}]);
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});
app.get('/api/contacts', async(req,res)=>{
  try{
    if(!supabase) return res.json([]);
    const {data} = await supabase.from('contacts').select('*').order('created_at',{ascending:false}).limit(100);
    res.json(data||[]);
  }catch(e){ res.json([]); }
});

// ORDERS
app.post('/api/orders', async(req,res)=>{
  try{
    if(supabase) await supabase.from('orders').insert([{...req.body, created_at:new Date().toISOString()}]);
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});
app.get('/api/orders', async(req,res)=>{
  try{
    if(!supabase) return res.json([]);
    const {data} = await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
    res.json(data||[]);
  }catch(e){ res.json([]); }
});

// CART
app.post('/api/cart', async(req,res)=>{
  try{
    if(supabase) await supabase.from('cart').insert([{...req.body, created_at:new Date().toISOString()}]);
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});
app.get('/api/cart', async(req,res)=>{
  try{
    if(!supabase) return res.json([]);
    const {data} = await supabase.from('cart').select('*').limit(100);
    res.json(data||[]);
  }catch(e){ res.json([]); }
});

// SUBSCRIBERS
app.post('/api/subscribe', async(req,res)=>{
  try{
    if(supabase) await supabase.from('subscribers').insert([{email:req.body.email, created_at:new Date().toISOString()}]);
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});

// FRONTEND
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('AltraAI Live '+PORT+' - I am AltraAI for everything'));
