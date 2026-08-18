const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let submissions = [];
let careers = [];

// Routes
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/client-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'client-dashboard.html')));
app.get('/career', (req, res) => res.sendFile(path.join(__dirname, 'career.html')));

// Registration Form Submission Endpoint
app.post('/api/register', (req, res) => {
    const { name, phone, service } = req.body;
    submissions.push({ name, phone, service, date: new Date().toLocaleString() });
    res.json({ success: true });
});

app.get('/api/submissions', (req, res) => res.json(submissions));

// Career Application Endpoint
app.post('/api/career', (req, res) => {
    const { name, email, skill, bio } = req.body;
    careers.push({ name, email, skill, bio, status: 'PENDING (Review by CEO)' });
    res.json({ success: true });
});

app.get('/api/careers', (req, res) => res.json(careers));

app.post('/api/career/status', (req, res) => {
    const { index, status } = req.body;
    if (careers[index]) {
        careers[index].status = status;
    }
    res.json({ success: true });
});

// AltraAI Gemini API Route with exact 10 services pricing
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.json({ reply: "Welcome to Zenova Peak Tech Hub! For exact pricing on our 10 services, contact Founder Ruby Garg at +2349067862223." });
    }

    const dataString = JSON.stringify({
        contents: [{
            parts: [{ 
                text: `You are AltraAI, an official assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223). Services & Pricing: 1. Consultancy ₦30K, 2. Altra AI Starter ₦55K+10K/mo, Premium ₦85K+15K/mo, Pro ₦150K+20K/mo, 3. GBP ₦35K, 4. Google Ads Starter ₦70K/mo, Growth ₦150K/mo, Pro ₦250K/mo, 5. Branding ₦30K+, 6. Web Dev Landing ₦120K, Backend ₦250K, FullStack ₦550K, 7. AI Video/Image ₦15K, 8. CAC BN ₦60K, Ltd ₦150K, NGO ₦220K, 9. SCUML/TIN ₦15K, 10. SMEDAN ₦10K. Answer query: ${message}` 
            }]
        }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': dataString.length }
    };

    const apiReq = https.request(options, (apiRes) => {
        let responseBody = '';
        apiRes.on('data', (chunk) => { responseBody += chunk; });
        apiRes.on('end', () => {
            try {
                const parsedData = JSON.parse(responseBody);
                if (parsedData.candidates && parsedData.candidates[0].content) {
                    res.json({ reply: parsedData.candidates[0].content.parts[0].text });
                } else {
                    res.json({ reply: "Contact us on WhatsApp: +2349067862223 for instant bookings." });
                }
            } catch (e) {
                res.json({ reply: "For immediate assistance, message Founder Ruby Garg at +2349067862223." });
            }
        });
    });

    apiReq.on('error', () => {
        res.json({ reply: "Connection error. Contact Ruby Garg at +2349067862223." });
    });

    apiReq.write(dataString);
    apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zenova server running on port ${PORT}`));
