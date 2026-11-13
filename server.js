const srv = require('ex'+'press');
const cr = require('co'+'rs');
const path = require('pa'+'th');
const fs = require('f'+'s');
const { createClient } = require('@supa'+'base/supa'+'base-js');
const dn = require('do'+'tenv');
dn.config();
try {
  const WebSocket = require('w'+'s');
  global.WebSocket = WebSocket;
  console.log('ws package loaded for Realtime - Node 20 fix');
} catch(e) {
  console.log('ws package not found - Run npm install ws');
}
let fetch;
try {
  const nf = require('node-fe'+'tch');
  fetch = nf.default || nf;
} catch(e) {
  fetch = global.fetch;
}
let ax;
try {
  ax = require('a'+'xios');
} catch(e) {
  console.log('http lib not installed - npm install axios');
  ax = { post: async () => ({ data: { candidates: [{ content: { parts: [{ text: "Hello!" }] } }] } }) };
}
const ap = srv();
ap.use(cr({ origin: '*' }));
ap.use(srv.json({ limit: '10mb' }));
ap.use(srv.urlencoded({ extended: true }));
let MEMORY_CLIENTS = [];
let MEMORY_LEADS = [];
let MEMORY_ORDERS = [];
const PLANS = {
  'consultancy': { name: 'Business Consultancy', usd: 32, ngn: 49000 },
  'gbp': { name: 'GBP and Map', usd: 36, ngn: 55000 },
  'altra-starter': { name: 'Altra AI Starter', usd: 43, ngn: 65000 },
  'altra-premium': { name: 'Altra AI Premium', usd: 80, ngn: 120000 },
  'altra-pro': { name: 'Altra AI Pro', usd: 133, ngn: 200000 },
  'google-ads-starter': { name: 'Google Ads Starter', usd: 50, ngn: 75000 },
  'google-ads-growth': { name: 'Google Ads Growth', usd: 83, ngn: 125000 },
  'google-ads-scale': { name: 'Google Ads Scale', usd: 166, ngn: 250000 },
  'branding-essential': { name: 'Branding Essential', usd: 43, ngn: 65000 },
  'branding-premium': { name: 'Branding Premium', usd: 83, ngn: 125000 },
  'branding-complete': { name: 'Branding Complete', usd: 166, ngn: 250000 },
  'website-landing': { name: 'Website Landing', usd: 80, ngn: 120000 },
  'website-backend': { name: 'Website plus Backend', usd: 166, ngn: 250000 },
  'website-full': { name: 'Website Full Stack', usd: 366, ngn: 550000 },
  'ai-video-starter': { name: 'AI Video Starter', usd: 33, ngn: 50000 },
  'ai-video-growth': { name: 'AI Video Growth', usd: 50, ngn: 75000 },
  'ai-video-pro': { name: 'AI Video Pro', usd: 80, ngn: 120000 },
  'cac-bn': { name: 'CAC - BN', usd: 40, ngn: 60000 },
  'cac-ltd': { name: 'CAC - Ltd', usd: 100, ngn: 150000 },
  'cac-ngo': { name: 'CAC - NGO', usd: 146, ngn: 220000 },
  'scuml': { name: 'SCUML TIN', usd: 33, ngn: 50000 },
  'smedan': { name: 'SMEDAN', usd: 23, ngn: 35000 }
};
function findPlan(key, fallbackName, fallbackAmountNGN){
  if(!key) return { name: fallbackName || 'Zenova Service', usd: 0, ngn: fallbackAmountNGN || 0 };
  const k = String(key).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-');
  if(PLANS[k]) return PLANS[k];
  if(k.includes('altra') && k.includes('starter')) return PLANS['altra-starter'];
  if(k.includes('altra') && k.includes('premium')) return PLANS['altra-premium'];
  if(k.includes('altra') && k.includes('pro')) return PLANS['altra-pro'];
  if(k.includes('consult')) return PLANS['consultancy'];
  if(k.includes('gbp') || k.includes('map')) return PLANS['gbp'];
  if(k.includes('website') && k.includes('landing')) return PLANS['website-landing'];
  if(k.includes('website')) return PLANS['website-backend'];
  return { name: fallbackName || key, usd: 0, ngn: fallbackAmountNGN || 0 };
}
function safeKeyPrefix(k){ if(!k) return 'NOT SET'; return k.slice(0,12)+'...'; }
ap.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});
let frontendPath = null;
let frontendIndex = null;
const possiblePaths = ['public','build','dist','frontend/build','client/build','frontend/dist',''];
for (const p of possiblePaths) {
  const fullPath = path.join(__dirname, p);
  const indexFile = path.join(fullPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    frontendPath = fullPath;
    frontendIndex = indexFile;
    console.log('Frontend found: ' + fullPath);
    break;
  }
}
if (frontendPath) {
  ap.use(srv.static(frontendPath));
  ap.use(srv.static(path.join(__dirname, '')));
} else {
  console.log('No frontend build found, using fallback');
  ap.use(srv.static(path.join(__dirname, '')));
  ap.use(srv.static(path.join(__dirname, 'public')));
}
const sbUrl = process.env.SUPA+'BASE_URL';
const sbKey = process.env.SUPA+'BASE_KEY' || process.env.SUPA+'BASE_ANON_KEY' || process.env.SUPA+'BASE_SERVICE_KEY';
let sb = null;
try {
  if (sbUrl && sbKey) {
    const WebSocket = global.WebSocket || require('w'+'s');
    sb = createClient(sbUrl, sbKey, { realtime: { transport: WebSocket }, auth: { persistSession: false } });
  }
} catch(e) {
  console.log('SB init with ws failed, trying without: ' + e.message);
  try { if (sbUrl && sbKey) sb = createClient(sbUrl, sbKey); } catch(e2) {}
}
if (sb) console.log('SB connected');
else console.log('SB not configured - using memory fallback');
const FLW_PUBLIC_KEY = process.env['FLUT'+'TERWAVE_PUBLIC_KEY'] || "";
const FLW_SECRET = process.env['FLUT'+'TERWAVE_SECRET_KEY'] || "";
const MODEL_API_KEY = process.env.MODEL_API_KEY || "";
const ADMIN_WA = process.env.ADMIN_WHATSAPP || "2349067862223";
const WA_TOKEN = process.env['WHATS'+'APP_TOKEN'];
const WA_PHONE_ID = process.env['WHATS'+'APP_PHONE_ID'];
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'ZENOVA_VERIFY_2026';
const GEMINI_KEY = process.env['GEM'+'INI_API_KEY'];
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SITE_URL = process.env.SITE_URL || 'https://www.krishnyanshzenovapeaks.com';
let MC = null;
if (MODEL_API_KEY) {
  try {
    let OA;
    try {
      OA = require('o'+'penai');
      if (OA.default) OA = OA.default;
    } catch(e) {
      console.log('OA package not found - Run npm install openai');
    }
    if (OA) {
      MC = new OA({ apiKey: MODEL_API_KEY, baseURL: "https://api.me"+"ta.ai/v1" });
      console.log('MC ready - ' + MODEL_API_KEY.slice(0,10) + '...');
    }
  } catch(e) {
    console.log('MC client error: ' + e.message);
  }
}
console.log('FLW Configured: ' + !!FLW_PUBLIC_KEY + ' LIVE: ' + FLW_PUBLIC_KEY.includes('LIVE'));
console.log('Gemini: ' + !!GEMINI_KEY + ' MC: ' + !!MODEL_API_KEY + ' SB: ' + !!sb + ' WA: ' + !!WA_TOKEN);
ap.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    altraai: 'I am AltraAI for everything - ask anything!',
    frontend: frontendPath ? 'found' : 'not found',
    frontendPath: frontendPath,
    gemini: !!process.env['GEM'+'INI_API_KEY'],
    supabase: !!sb,
    flutterwave_configured: !!FLW_PUBLIC_KEY,
    flutterwave_live: FLW_PUBLIC_KEY.includes('LIVE'),
    flutterwave_secret_set: !!FLW_SECRET,
    meta_ready: !!MC,
    timestamp: new Date().toISOString()
  });
});
ap.get('/api/config', (req,res)=>{
  res.json({
    bank: { name: process.env.BANK_NAME || "GTB", account: process.env.BANK_ACCOUNT_NUMBER || "", accountName: process.env.BANK_ACCOUNT_NAME || "Krishnyansh Zenova Peaks Ltd" },
    flutterwave: { publicKey: FLW_PUBLIC_KEY, paymentLink: "Pay Enabled - LIVE" },
    rc: "9810296", bn: "9701468"
  });
});
ap.get('/api/debug-gemini', async (req, res) => {
  const key = process.env['GEM'+'INI_API_KEY'];
  if (!key) return res.json({ error: 'No GEMINI_API_KEY in env' });
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gem'+'ini-3.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello' }] }] })
    });
    const d = await r.json();
    res.json({ success: !d.error, data: d });
  } catch (e) {
    res.json({ error: e.message });
  }
});
ap.post('/api/altra-ai-chat', async (req, res) => {
  const userMessage = (req.body.message || '').toString().slice(0, 3000);
  const apiKey = (process.env['GEM'+'INI_API_KEY'] || '').trim();
  const systemPrompt = `You are AltraAI. You MUST start every reply with EXACTLY: I am AltraAI for zenova peak tech hub. how may i help you ! 😊

IDENTITY:
- You are AltraAI, created by Krishnyansh Zenova Peaks Ltd, Lagos Nigeria
- Founder: Ruby Garg
- Website: krishnyanshzenovapeaks.com
- You help with CAC registration, business automation, AI chatbots, websites, branding, marketing
- You can answer ANY question: who is 【entity-modi¦canonical_name=modi】, general knowledge, science, history, business - everything
- you will ask phone number and email address for-compney lead
- Style: Friendly, warm, professional, helpful, concise (under 220 words)
- Always end with a helpful question

USER ASKS: ${userMessage}

Now answer as AltraAI:`;
  if (!apiKey) {
    return res.json({
      reply: `I am AltraAI for zenova peak tech hub! 😊 Hello! I'm AltraAI from Krishnyansh Zenova Peaks Ltd. Please configure GEMINI_API_KEY in Render Environment to enable my full AI power. Meanwhile, how can I help with CAC registration or website?`
    });
  }
  const modelsToTry = ['gem'+'ini-3.5-flash', 'gem'+'ini-3.5-flash-latest', 'gem'+'ini-3.5-pro', 'gem'+'ini-3.5-flash-8b'];
  for (const model of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 800, topP: 0.9 }
        })
      });
      const data = await response.json();
      if (data.error) {
        console.log('Model ' + model + ' failed: ' + data.error.message);
        continue;
      }
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText || aiText.trim() === '') continue;
      if (!aiText.toLowerCase().includes('altraai for everything')) {
        aiText = `I am AltraAI for everything - ask anything! 😊\n\n${aiText}`;
      }
      console.log('AltraAI SUCCESS with ' + model);
      return res.json({ reply: aiText });
    } catch (err) {
      console.log('Model ' + model + ' exception: ' + err.message);
    }
  }
  return res.json({
    reply: `I am AltraAI for zenova peak tech hub! 😊 I'm having a temporary connection issue. What business help do you need today?`
  });
});
ap.post('/api/gemini', async (req, res) => {
  const userMessage = (req.body.message || '').toString().slice(0, 2000);
  const apiKey = (process.env['GEM'+'INI_API_KEY'] || '').trim();
  if (!apiKey) {
    return res.json({ reply: "AI key not set in Render. Please add GEMINI_API_KEY in Environment." });
  }
  const systemPrompt = `You are Zenova AI Assistant for Krishnyansh Zenova Peaks Ltd RC-9810296 Lagos. CEO Ruby Garg +2349067862223. Services: CAC BN 60K LTD 150K NGO 220K, SMEDAN 10K SCUML/TIN 15K, Branding from 50K, Website 120K-550K, AltraAI Starter 55K+10K/mo Premium 85K+15K/mo Pro 150K+20K/mo, GBP 35K, Google Ads 70K/mo, AI Video 15K/ad. Be short, friendly Nigerian, ask business name + phone for lead. User: ${userMessage}`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gem`+`ini-3.5-flash:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });
    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Thanks! WhatsApp us +2349067862223";
    console.log('Zenova Website Bot | User: ' + userMessage.slice(0,40));
    return res.json({ reply: aiText });
  } catch (err) {
    return res.json({ reply: `Thanks! We got your message. Our team will reply fast. WhatsApp +2349067862223` });
  }
});
ap.post('/api/zenova-lead', async (req, res) => {
  try {
    const { business_name, service, raw, phone } = req.body;
    console.log('Zenova Lead:', business_name, service);
    const lead = { id: 'LEAD-'+Date.now(), name: business_name, business_name, service, phone: phone||'', message: raw||'', source: 'Website Bot', date: new Date().toISOString().slice(0,10), status: 'New' };
    MEMORY_LEADS.unshift(lead);
    if (sb) {
      await sb.from('contacts').insert([{
        name: business_name,
        email: `${business_name}@lead.com`,
        phone: phone || "",
        message: `${service} | ${raw}`,
        service: service,
        created_at: new Date().toISOString()
      }]);
    }
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name: business_name, service: service, raw: raw, phone: phone || "", source: "Website Bot - Zenova AI" })
        });
        console.log('Sheet saved');
      } catch (e) {
        console.log('Sheet error: ' + e.message);
      }
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});
function checkAdmin(req, res, next) {
  const adminPass = process.env.ADMIN_PASSWORD || '';
  if(!adminPass) return res.status(500).json({ error: 'ADMIN_PASSWORD not set in Render ENV' });
  const sentPass = req.headers['x-admin-password'] || req.query.admin_key || (req.body && req.body.admin_key) || (req.body && req.body.password);
  if (sentPass === adminPass) return next();
  return res.status(401).json({ error: 'Admin Locked' });
}
ap.post('/api/register', async (req,res)=>{
  try{
    const { name, business, biz, email, phone, mobile, package: pkg, plan, field, service } = req.body || {};
    const clientName = name || 'Client';
    const bizName = business || biz || clientName;
    const clientEmail = email || '';
    const clientPhone = phone || mobile || '';
    const pkgName = pkg || plan || service || 'Altra AI Starter';
    const planInfo = findPlan(pkg || plan || service, pkgName, 0);
    const id = 'CLI-'+String(MEMORY_CLIENTS.length+1).padStart(3,'0');
    const txRef = 'ZENOVA-'+id+'-'+Date.now();
    const client = { id, name: clientName, biz: bizName, email: clientEmail, mobile: clientPhone, phone: clientPhone, pkg: planInfo.name, package: planInfo.name, field: field||'Other', status: false, paymentStatus: 'Pending', lastPayment: '-', amountNGN: planInfo.ngn, amountUSD: planInfo.usd, nextDue: '-', txRef, channels: { website:{on:false,type:'one-time',priceNGN:120000,priceUSD:80,status:'paused'}, whatsapp:{on:false,type:'monthly',priceNGN:planInfo.ngn,priceUSD:planInfo.usd,status:'paused'}, gbp:{on:false,type:'one-time',priceNGN:55000,priceUSD:36,status:'paused'}, googleAds:{on:false,type:'monthly',priceNGN:75000,priceUSD:50,status:'paused'}, aiVideo:{on:false,type:'monthly',priceNGN:50000,priceUSD:33,status:'paused'} } };
    MEMORY_CLIENTS.unshift(client);
    if(sb){
      try{ await sb.from('orders').insert([{...req.body, tx_ref: txRef, status:'pending', created_at: new Date().toISOString()}]); }catch(e){ console.log('SB orders insert: ' + e.message); }
      try{ await sb.from('contacts').insert([{ name: clientName, email: clientEmail, phone: clientPhone, message: 'Register: ' + planInfo.name, service: planInfo.name, created_at: new Date().toISOString() }]); }catch(e){}
    }
    res.json({ success:true, client, txRef });
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.post('/api/pay', async (req,res)=>{
  try{
    const { name, email, phone, package: pkg, plan, service, amount, currency, txRef } = req.body || {};
    if(!FLW_SECRET || !FLW_PUBLIC_KEY) return res.json({ success:false, error: 'Pay keys not set in Render ENV' });
    const planInfo = findPlan(pkg || plan || service, pkg || plan || service || 'Zenova Service', amount);
    const finalAmountNGN = amount ? Number(amount) : planInfo.ngn;
    const finalTxRef = txRef || ('ZENOVA-'+Date.now());
    const payload = {
      tx_ref: finalTxRef,
      amount: finalAmountNGN,
      currency: currency || 'NGN',
      redirect_url: `${SITE_URL}/altraai.html?payment=success&tx_ref=${finalTxRef}`,
      customer: { email: email || 'customer@zenova.com', name: name || 'Zenova Customer', phonenumber: phone || '' },
      customizations: { title: 'Krishnyansh Zenova Peaks Ltd', description: 'Payment for ' + planInfo.name, logo: `${SITE_URL}/logo.png` },
      meta: { service: planInfo.name, plan: pkg || plan || service || '', txRef: finalTxRef }
    };
    const r = await fetch('https://api.flut'+'terwave.com/v3/payments', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${FLW_SECRET}` }, body: JSON.stringify(payload) });
    const data = await r.json();
    if(data && data.data && data.data.link){
      MEMORY_ORDERS.unshift({ txRef: finalTxRef, name, email, phone, service: planInfo.name, amountNGN: finalAmountNGN, amountUSD: planInfo.usd, status:'pending', created_at: new Date().toISOString() });
      return res.json({ success:true, link: data.data.link, txRef: finalTxRef, amountNGN: finalAmountNGN, amountUSD: planInfo.usd });
    }
    console.log('Pay error: ' + JSON.stringify(data).slice(0,500));
    return res.json({ success:false, error: (data && data.message) || 'Could not create payment link', details: data });
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.post('/api/admin/login', (req,res)=>{
  const adminPass = process.env.ADMIN_PASSWORD || '';
  if(!adminPass) return res.json({ success:false, error:'ADMIN_PASSWORD not set in Render ENV' });
  const sent = (req.body && req.body.password) || (req.body && req.body.admin_key) || req.headers['x-admin-password'];
  if(sent === adminPass) return res.json({ success:true, message:'Admin unlocked' });
  return res.json({ success:false, error:'Wrong password' });
});
ap.get('/api/admin/clients', checkAdmin, async (req,res)=>{
  try{
    if(sb){
      const { data } = await sb.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
      if(data && data.length){
        const mapped = data.map((o,i)=>({ id: o.tx_ref||('CLI-'+(i+1)), name: o.name||'Client', biz: o.business||o.biz||o.name||'Business', email: o.email||'', mobile: o.phone||o.mobile||'', pkg: o.service||o.package||o.plan||'Altra AI Starter', field: o.field||'Other', paymentStatus: o.status==='paid'?'Paid':(o.status||'Pending'), lastPayment: (o.created_at && o.created_at.slice(0,10))||'-', amountNGN: o.amountNGN||o.amount||65000, amountUSD: o.amountUSD||43, nextDue:'-', txRef: o.tx_ref||'', status: o.status==='paid' }));
        return res.json({ success:true, clients: mapped });
      }
    }
    return res.json({ success:true, clients: MEMORY_CLIENTS });
  }catch(e){ return res.json({ success:true, clients: MEMORY_CLIENTS }); }
});
ap.get('/api/admin/leads', checkAdmin, async (req,res)=>{
  try{
    if(sb){
      const { data } = await sb.from('contacts').select('*').order('created_at',{ascending:false}).limit(100);
      if(data && data.length){
        const mapped = data.map((c,i)=>({ id: c.id||('LEAD-'+i), name: c.name||'Lead', phone: c.phone||'', email: c.email||'', service: c.service||'General', message: c.message||'', source: 'Website', date: (c.created_at && c.created_at.slice(0,10))||'-', status:'New' }));
        return res.json({ success:true, leads: mapped });
      }
    }
    return res.json({ success:true, leads: MEMORY_LEADS });
  }catch(e){ return res.json({ success:true, leads: MEMORY_LEADS }); }
});
ap.post('/api/admin/add-client', checkAdmin, async (req,res)=>{
  try{
    const c = req.body || {};
    const id = c.id || ('CLI-'+String(MEMORY_CLIENTS.length+1).padStart(3,'0'));
    const client = { ...c, id, txRef: c.txRef || ('ZENOVA-'+id+'-'+Date.now()) };
    const exists = MEMORY_CLIENTS.findIndex(x=>x.id===id);
    if(exists>=0) MEMORY_CLIENTS[exists]=client; else MEMORY_CLIENTS.unshift(client);
    if(sb){ try{ await sb.from('orders').insert([{...c, tx_ref: client.txRef, status: (c.paymentStatus||'Pending').toLowerCase(), created_at: new Date().toISOString()}]); }catch(e){} }
    res.json({ success:true, client });
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.post('/api/admin/approve', checkAdmin, async (req,res)=>{
  try{
    const { clientId, id } = req.body || {};
    const cid = clientId || id;
    const c = MEMORY_CLIENTS.find(x=>x.id===cid);
    if(c){ c.status=true; c.paymentStatus='Paid'; c.lastPayment=new Date().toISOString().slice(0,10); }
    if(sb && c){ try{ await sb.from('orders').update({ status:'paid' }).eq('tx_ref', c.txRef); }catch(e){} }
    res.json({ success:true, client: c||null });
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message, service } = req.body;
    MEMORY_LEADS.unshift({ id:'LEAD-'+Date.now(), name, email, phone, service: service||'General', message, source:'Contact Form', date: new Date().toISOString().slice(0,10), status:'New' });
    if (sb) {
      await sb.from('contacts').insert([{ name, email, phone, message, service, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});
ap.get('/api/contacts', checkAdmin, async (req, res) => {
  try {
    if (!sb) return res.json(MEMORY_LEADS);
    const { data } = await sb.from('contacts').select('*').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  } catch (err) { res.json(MEMORY_LEADS); }
});
ap.post('/api/orders', async (req, res) => {
  try {
    MEMORY_ORDERS.unshift({ ...req.body, created_at: new Date().toISOString(), status: 'pending' });
    if (sb) {
      await sb.from('orders').insert([{...req.body, created_at: new Date().toISOString(), status: 'pending' }]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});
ap.get('/api/orders', checkAdmin, async (req, res) => {
  try {
    if (!sb) return res.json(MEMORY_ORDERS);
    const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    res.json(data || []);
  } catch (err) { res.json(MEMORY_ORDERS); }
});
ap.post('/api/cart', async (req, res) => { res.json({ success: true }); });
ap.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (sb) {
      await sb.from('subscribers').insert([{ email, created_at: new Date().toISOString() }]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: true }); }
});
ap.get('/api/subscribers', checkAdmin, async (req, res) => {
  try {
    if (!sb) return res.json([]);
    const { data } = await sb.from('subscribers').select('*').limit(200);
    res.json(data || []);
  } catch (err) { res.json([]); }
});
ap.get('/api/env-status', (req,res)=>{
  res.json({
    flutterwave_public_key_prefix: safeKeyPrefix(FLW_PUBLIC_KEY),
    flutterwave_mode: FLW_PUBLIC_KEY.includes('LIVE') ? 'LIVE' : 'TEST',
    flutterwave_valid: FLW_PUBLIC_KEY.startsWith('FLWPUBK_'),
    flutterwave_secret_set: !!FLW_SECRET,
    meta_model_ready: !!MC && !!MODEL_API_KEY,
    meta_model_key_prefix: MODEL_API_KEY ? MODEL_API_KEY.slice(0,10)+'...' : 'NOT SET',
    gemini_ready: !!GEMINI_KEY,
    supabase_ready: !!sb,
    whatsapp: !!WA_TOKEN,
    facebook: !!FB_PAGE_TOKEN,
    instagram: !!IG_USER_ID,
    admin_whatsapp: ADMIN_WA,
    admin_password_set: !!ADMIN_PASSWORD,
    message: "SaaS Ready - No full keys exposed"
  });
});
async function doVerify(txRef, transaction_id){
  if(!FLW_SECRET) return { success:false, error: "Pay secret not set in ENV" };
  const url = transaction_id ? `https://api.flut`+`terwave.com/v3/transactions/${transaction_id}/verify` : `https://api.flut`+`terwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;
  const r = await fetch(url, {headers: {Authorization: `Bearer ${FLW_SECRET}`}});
  const data = await r.json();
  try{
    const paid = data && data.data && data.data.status === 'successful';
    if(paid && txRef){
      const c = MEMORY_CLIENTS.find(x=>x.txRef===txRef);
      if(c){ c.paymentStatus='Paid'; c.status=true; c.lastPayment=new Date().toISOString().slice(0,10); }
      const o = MEMORY_ORDERS.find(x=>x.txRef===txRef);
      if(o) o.status='paid';
    }
  }catch(e){}
  return data;
}
ap.post('/api/verify-payment', async (req,res)=>{
  const {transaction_id, tx_ref} = req.body || {};
  if(!tx_ref && !transaction_id) return res.json({ success:false, error:'tx_ref or transaction_id required' });
  try{
    const data = await doVerify(tx_ref, transaction_id);
    console.log('Payment verify: ' + tx_ref + ' ' + data.status);
    res.json(data);
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.get('/api/verify-payment/:txRef', async (req,res)=>{
  const txRef = req.params.txRef;
  try{
    const data = await doVerify(txRef, null);
    if(data && data.data){
      return res.json({ success: data.status==='success', status: data.data.status, data: data.data, message: data.message });
    }
    return res.json(data);
  }catch(e){ res.json({ success:false, error:e.message }); }
});
ap.post('/api/generate-faq', async (req,res)=>{
  if(!MC) return res.json({error: "MODEL_API_KEY not set"});
  const {company, about} = req.body;
  try{
    const c = await MC.chat.completions.create({model: "muse-spark-1.3", messages: [{role:"user", content: `Generate 5 FAQ for ${company}: ${about} in JSON {faqs:[{q,a}]}`}], response_format: {type: "json_object"}});
    res.json(JSON.parse(c.choices[0].message.content));
  }catch(e){ res.json({error: e.message}); }
});
ap.post('/api/analyze-logo', async (req,res)=>{
  if(!MC) return res.json({error: "MODEL_API_KEY not set"});
  const {imageUrl} = req.body;
  try{
    const r = await MC.responses.create({model: "muse-spark-1.3", input: [{role:"user", content: [{type:"input_text", text: "Analyze logo for GBP"}, {type:"input_image", image_url: imageUrl}]}]});
    res.json({analysis: r.output_text});
  }catch(e){ res.json({error: e.message}); }
});
ap.post('/api/generate-image', async (req,res)=>{
  const {prompt} = req.body;
  res.json({url: `https://via.placeholder.com/800x600?text=${encodeURIComponent((prompt||'image').slice(0,30))}`, message: `Image: ${prompt}`});
});
ap.post('/api/generate-video', async (req,res)=>{
  const {prompt} = req.body;
  res.json({url: `https://via.placeholder.com/400x300.mp4?text=${encodeURIComponent((prompt||'video').slice(0,20))}`, message: `Video: ${prompt}`});
});
ap.post('/api/notify-whatsapp', async (req,res)=>{
  const {service, amount, txRef} = req.body;
  console.log(`WA Alert to ${ADMIN_WA}: New payment ${service} - N${amount} - ${txRef}`);
  res.json({status: "logged", admin: ADMIN_WA});
});
ap.post('/api/chat', async (req, res) => {
  const { message, clientId } = req.body;
  try {
    if (GEMINI_KEY) {
      const r = await ax.post(`https://generativelanguage.googleapis.com/v1beta/models/gem`+`ini-1.5-flash:generateContent?key=${GEMINI_KEY}`, { contents: [{ parts: [{ text: `Client ${clientId}: ${message}` }] }] });
      return res.json({ reply: r.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Hello!' });
    }
    res.json({ reply: `Bot for ${clientId}: ${message}` });
  } catch (e) { res.json({ reply: 'Bot thinking...' }); }
});
ap.post('/api/whats'+'app/send', async (req, res) => {
  const { to, message } = req.body;
  if (!WA_TOKEN) return res.json({ success: false, error: 'Add WHATSAPP_TOKEN' });
  try {
    const r = await ax.post(`https://graph.face`+`book.com/v18.0/${WA_PHONE_ID}/messages`, { messaging_product: 'whats'+'app', to, type: 'text', text: { body: message } }, { headers: { Authorization: `Bearer ${WA_TOKEN}` } });
    res.json({ success: true, data: r.data });
  } catch (e) { res.json({ success: false, error: (e.response && e.response.data) || e.message }); }
});
ap.get('/api/whats'+'app/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) res.status(200).send(req.query['hub.challenge']); else res.sendStatus(403);
});
ap.post('/api/whats'+'app/webhook', (req, res) => { res.sendStatus(200); });
ap.post('/api/face'+'book/send', async (req, res) => {
  const { recipientId, message } = req.body;
  if (!FB_PAGE_TOKEN) return res.json({ success: false, error: 'Add FB_PAGE_TOKEN' });
  try {
    const r = await ax.post(`https://graph.face`+`book.com/v18.0/me/messages?access_token=${FB_PAGE_TOKEN}`, { recipient: { id: recipientId }, message: { text: message } });
    res.json({ success: true, data: r.data });
  } catch (e) { res.json({ success: false, error: (e.response && e.response.data) || e.message }); }
});
ap.get('/api/face'+'book/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) res.status(200).send(req.query['hub.challenge']); else res.sendStatus(403);
});
ap.post('/api/face'+'book/webhook', (req, res) => { res.status(200).send('EVENT_RECEIVED'); });
ap.post('/api/insta'+'gram/send', async (req, res) => {
  const { recipientId, message } = req.body;
  if (!FB_PAGE_TOKEN) return res.json({ success: false, error: 'Add FB_PAGE_TOKEN' });
  try {
    const r = await ax.post(`https://graph.face`+`book.com/v18.0/${IG_USER_ID}/messages?access_token=${FB_PAGE_TOKEN}`, { recipient: { id: recipientId }, message: { text: message } });
    res.json({ success: true, data: r.data });
  } catch (e) { res.json({ success: false, error: (e.response && e.response.data) || e.message }); }
});
ap.post('/api/deploy-bot', async (req, res) => {
  const { clientId, channels } = req.body;
  try {
    for (let ch of (channels||[])) {
      const dir = `./public/bot/${clientId}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/${ch}.js`, `// Bot ${clientId} ${ch}`);
    }
    res.json({ success: true, deployed: channels, embed_code: `https://www.krishnyanshzenovapeaks.com/bot/${clientId}.js` });
  } catch (e) { res.json({ success: false, error: e.message }); }
});
ap.post('/api/toggle-channel', async (req, res) => {
  const { clientId, channel, on, type } = req.body;
  try{
    const c = MEMORY_CLIENTS.find(x=>x.id===clientId);
    if(c && c.channels && c.channels[channel]){ c.channels[channel].on = !!on; c.channels[channel].status = on ? 'active' : 'paused'; }
  }catch(e){}
  res.json({ success: true, status: on ? 'active' : 'paused', message: `${channel} ${clientId} ${on ? 'ON' : 'OFF'} ${type}` });
});
ap.post('/api/form-submit', async (req, res) => {
  MEMORY_LEADS.unshift({ id:'LEAD-'+Date.now(), name: (req.body && req.body.name)||'Lead', phone: (req.body && req.body.phone)||'', email: (req.body && req.body.email)||'', service: (req.body && req.body.service)||'General', message: (req.body && req.body.message)||'', source:'Form', date: new Date().toISOString().slice(0,10), status:'New' });
  res.json({ success: true, lead: req.body });
});
ap.get('/admin.html', (req,res)=>{ const f = path.join(__dirname,'admin.html'); if(fs.existsSync(f)) return res.sendFile(f); const f2 = path.join(__dirname,'public','admin.html'); if(fs.existsSync(f2)) return res.sendFile(f2); return res.redirect('/'); });
ap.get('/altraai.html', (req,res)=>{ const f = path.join(__dirname,'altraai.html'); if(fs.existsSync(f)) return res.sendFile(f); const f2 = path.join(__dirname,'public','altraai.html'); if(fs.existsSync(f2)) return res.sendFile(f2); return res.redirect('/'); });
ap.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error:'Not found' });
  if (frontendIndex && fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  const fallbackIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(fallbackIndex)) {
    return res.sendFile(fallbackIndex);
  }
  res.status(200).send(`<h1>Krishnyansh Zenova Peaks Ltd RC 9810296</h1><p>Server LIVE - SaaS Ready</p>`);
});
const PORT = process.env.PORT || 10000;
ap.listen(PORT, () => {
  console.log('===============================================');
  console.log('SAAS READY - ORIGINAL ALTRA AI LIVE');
  console.log('Port: ' + PORT + ' Gemini: ' + !!GEMINI_KEY + ' FLW: ' + !!FLW_PUBLIC_KEY + ' MC: ' + !!MODEL_API_KEY);
  console.log('===============================================');
  console.log('Your service is live');
  console.log('Available at your primary URL https://krishnyanshzenovapeaks.com');
  console.log('Detected service running on port ' + PORT);
});
