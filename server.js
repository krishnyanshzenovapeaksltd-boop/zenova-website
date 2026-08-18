const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// ADMIN PANEL ROUTES
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ALTRA AI GEMINI API ROUTE
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Yeh Render ke environment variable se key utha lega automatically
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ reply: "API Key not configured in Environment Variables." });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `You are AltraAI, powered by Gemini, a professional assistant for Krishnyansh Zenova Peak Tech Hub (+2349067862223). Answer this: ${message}` 
                    }]
                }]
            })
        });

        const data = await response.json();
        let reply = "I am here to assist you!";
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            reply = data.candidates[0].content.parts[0].text;
        }
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ reply: "AI Server Error." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
