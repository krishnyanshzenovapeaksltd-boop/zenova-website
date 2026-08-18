const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Admin Panel Routes
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// AltraAI Gemini API Route (Fixed & Secure)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in environment variables!");
            return.status(500).json({ reply: "Server Error: AI API Key not configured." });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `You are AltraAI, powered by Gemini, a professional tech and business assistant for Krishnyansh Zenova Peak Tech Hub (BN 9701468, Founder: Ruby Garg, Phone: +2349067862223). Answer this professionally: ${message}` 
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            console.error("Invalid Gemini API Structure:", JSON.stringify(data));
            res.json({ reply: "AltraAI received your message but encountered an issue processing the response." });
        }
    } catch (error) {
        console.error("AI Server Fetch Error:", error);
        res.status(500).json({ reply: "AI Server Connection Error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zenova Server running on port ${PORT}`));
