const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Admin Panel Routes
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// AltraAI Gemini API Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.json({ reply: "Hello! Welcome to Krishnyansh Zenova Peak Tech Hub. For CAC registration, business plans, or our services, please contact Founder Ruby Garg directly on WhatsApp at +2349067862223." });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `You are AltraAI, an official professional assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223, Website: krishnyanshzenovapeaks.com). Provide helpful answers about our business registration, CAC, SMEDAN, branding, and pricing. Answer this user query: ${message}` 
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "Thank you for reaching out to Zenova Peak Tech Hub! For instant pricing and bookings, message us on WhatsApp: +2349067862223." });
        }
    } catch (error) {
        console.error("AI Error:", error);
        res.json({ reply: "Hello! We are here to help you start your business across Nigeria. Contact Founder Ruby Garg at +2349067862223 for immediate assistance." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zenova server running on port ${PORT}`));
