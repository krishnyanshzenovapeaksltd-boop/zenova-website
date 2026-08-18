const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/client-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'client-dashboard.html')));

// AltraAI Gemini API Route
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.json({ reply: "Welcome to Zenova Peak Tech Hub! For pricing, automation, or CAC registration, contact Founder Ruby Garg at +2349067862223." });
    }

    const dataString = JSON.stringify({
        contents: [{
            parts: [{ 
                text: `You are AltraAI, an official professional assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223). Provide helpful answers about our pricing (CAC ₦35k, SMEDAN ₦20k, AltraAI ₦75k/mo, Business Plan ₦50k, Consultancy ₦30k, GBP ₦25k) and client business automation. Answer: ${message}` 
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
                    res.json({ reply: "Contact us on WhatsApp: +2349067862223 for instant bookings and automation." });
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
