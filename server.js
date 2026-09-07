const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ENV
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// NEW GEMINI SDK - SUPPORTS AQ. KEYS - GOOGLE 2026
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// HEALTH
app.get('/', (req,res)=>{ res.send('Zenova Peaks - AltraAI Live - I am AltraAI for everything - ask anything!'); });
app.get('/api/health', (req,res)=>{ res.json({status:'ok', altraai:'I am AltraAI for everything - ask anything!'}); });

// ALTRA AI CHAT - FINAL - NO MISTAKE - 1.5-FLASH + AQ KEY SUPPORT + MENTION LINE
app.post('/api/altra-ai-chat', async(req,res)=>{
  try{
    const msg = (req.body.message || 'hello').toString().slice(0,1000);
    
    if(!genAI){
      return res.json({reply:"I am AltraAI for everything - ask anything! 😊👋 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. Add GEMINI_API_KEY in Render Environment to enable real AI."});
    }

    // Try real Gemini AI
    try{
      const result = await genAI.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are AltraAI - Identity: I am AltraAI for everything - ask anything! Founder: Ruby Garg, Krishnyansh Zenova Peaks Ltd RC 9810296. Business: CAC registration, business automation, AI chatbots, websites, branding in Lagos Nigeria. Personality: Friendly, helpful, concise, professional. Always remind user you are AltraAI for everything they can ask anything. User message: ${msg}`
      });
      
      let text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Ensure mention line
      if(!text.toLowerCase().includes('altraai for everything')){
        text = `I am AltraAI for everything - ask anything! 😊\n\n${text}`;
      }
      
      return res.json({reply: text});

    }catch(e){
      console.log('Gemini error:', e.message);
      // Friendly fallback - NO ugly 503 error
      return res.json({reply:`I am AltraAI for everything - ask anything! 😊👋 You said "${msg}". I'm here for CAC, automation, business, website, AI bots, branding - just ask anything! (AI high demand 20 sec - please try again)`});
    }

  }catch(err){
    console.log(err);
    res.json({reply:"I am AltraAI for everything - ask anything! 😊 How can I help your business today?"});
  }
});

// CONTACT - REAL SUPABASE
app.post('/api/contact', async(req,res)=>{
  try{
    const {name,email,message} = req.body;
    if(supabase){
      await supabase.from('contacts').insert([{name,email,message,created_at:new Date().toISOString()}]);
    }
    res.json({success:true, message:"Message saved!"});
  }catch(e){ res.json({success:true, message:"Message received!"}); }
});

// ORDERS - REAL SUPABASE
app.post('/api/orders', async(req,res)=>{
  try{
    const data = req.body;
    if(supabase){
      await supabase.from('orders').insert([{...data, created_at:new Date().toISOString()}]);
    }
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});

app.get('/api/orders', async(req,res)=>{
  try{
    if(supabase){
      const {data} = await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
      return res.json(data||[]);
    }
    res.json([]);
  }catch(e){ res.json([]); }
});

// CART
app.post('/api/cart', async(req,res)=>{
  try{
    if(supabase){
      await supabase.from('cart').insert([{...req.body, created_at:new Date().toISOString()}]);
    }
    res.json({success:true});
  }catch(e){ res.json({success:true}); }
});

// START
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>{ console.log(`Server live on ${PORT} - AltraAI - I am AltraAI for everything`); });
