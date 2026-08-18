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
            return res.status(500).json({ reply: "Server Error: GEMINI_API_KEY is not configured in Render environment variables." });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `You are AltraAI, powered by Gemini, a professional assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223). Answer this: ${message}` 
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "AltraAI is currently processing your request. Please try again." });
        }
    } catch (error) {
        console.error("AI Route Error:", error);
        res.status(500).json({ reply: "AI Server Connection Error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zenova server running on port ${PORT}`));
