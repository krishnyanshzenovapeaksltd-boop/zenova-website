const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let submissions = [];
let careers = [];
let siteContent = {
    heroTitle: "Start Your Business Today – 100% Online Globally",
    promoImage: "images/founder.jpg"
};
let clientSubscriptions = { "client1": { status: "ACTIVE", name: "Default Enterprise" } };

// Admin Authentication Middleware (Password Lock)
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Admin Area"');
        return res.status(401).send('Authentication required.');
    }
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    if (auth[0] === 'Info@krishnyanshzenovapeaks.com' && auth[1] === 'Niharika@86') {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Admin Area"');
        return res.status(401).send('Access Denied: Invalid Credentials.');
    }
};

app.get('/admin', adminAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/client-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'client-dashboard.html')));
app.get('/career', (req, res) => res.sendFile(path.join(__dirname, 'career.html')));

// Public Endpoints
app.post('/api/register', (req, res) => {
    const { name, phone, service } = req.body;
    submissions.push({ name, phone, service, date: new Date().toLocaleString() });
    res.json({ success: true });
});
app.get('/api/submissions', adminAuth, (req, res) => res.json(submissions));

app.post('/api/career', (req, res) => {
    const { name, email, skill, bio } = req.body;
    careers.push({ name, email, skill, bio, status: 'PENDING (Review by CEO)' });
    res.json({ success: true });
});
app.get('/api/careers', adminAuth, (req, res) => res.json(careers));
app.post('/api/career/status', adminAuth, (req, res) => {
    const { index, status } = req.body;
    if (careers[index]) careers[index].status = status;
    res.json({ success: true });
});

// Content & Image Editor Endpoints
app.get('/api/content', (req, res) => res.json(siteContent));
app.post('/api/content', adminAuth, (req, res) => {
    const { heroTitle, promoImage } = req.body;
    if (heroTitle) siteContent.heroTitle = heroTitle;
    if (promoImage) siteContent.promoImage = promoImage;
    res.json({ success: true });
});

app.post('/api/admin/subscription', adminAuth, (req, res) => {
    const { clientId, status } = req.body;
    if (clientSubscriptions[clientId]) clientSubscriptions[clientId].status = status;
    res.json({ success: true });
});
app.get('/api/subscriptions', adminAuth, (req, res) => res.json(clientSubscriptions));

// Meta Webhook
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "zenova_secret_123";
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});
app.post('/webhook', (req, res) => {
    res.status(200).send('EVENT_RECEIVED');
});

// AltraAI Chat Route (Fully responsive to anything asked)
app.post('/api/chat', (req, res) => {
    const { history, message } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.json({ reply: "Hello! Welcome to Krishnyansh Zenova Peak Tech Hub (Founder: Ruby Garg). Contact us on WhatsApp at +2349067862223." });
    }

    let contents = [{
        role: "user",
        parts: [{ text: "System Instruction: You are AltraAI, an advanced, conversational AI assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223). Answer everything expertly and naturally like Gemini or Meta AI. Services & Pricing: 1. Business Consultancy ₦30K, 2. Altra AI Automation: Starter ₦55K+10K/mo, Premium ₦85K+15K/mo, Pro ₦150K+20K/mo, 3. GBP with Maps ₦35K, 4. Google Ads Management from ₦70K/mo, 5. Branding Pack From ₦30K, 6. Website Dev from ₦120K to ₦550K, 7. AI Video Studio ₦15K/ad, 8. CAC Registration (Nigeria Only) BN ₦60K, Ltd ₦150K, NGO ₦220K, 9. SCUML/TIN ₦15K, 10. SMEDAN ₦10K." }]
    }, {
        role: "model",
        parts: [{ text: "Understood! I am AltraAI, ready to assist." }]
    }];

    if (history && Array.isArray(history)) {
        history.forEach(h => {
            contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
        });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const dataString = JSON.stringify({ contents });
    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': dataString.length }
    };

    const apiReq = https.request(options, (apiRes) => {
        let responseBody = '';
        apiRes.on('data', chunk => responseBody += chunk);
        apiRes.on('end', () => {
            try {
                const parsed = JSON.parse(responseBody);
                if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                    res.json({ reply: parsed.candidates[0].content.parts[0].text });
                } else {
                    res.json({ reply: "For instant booking, reach Founder Ruby Garg at +2349067862223." });
                }
            } catch (e) {
                res.json({ reply: "Please contact Ruby Garg at +2349067862223." });
            }
        });
    });
    apiReq.on('error', () => res.json({ reply: "Connection error. Contact +2349067862223." }));
    apiReq.write(dataString);
    apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zenova server running on port ${PORT}`));
