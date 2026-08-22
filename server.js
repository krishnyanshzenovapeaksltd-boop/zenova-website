const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static HTML/CSS files from the root directory
app.use(express.static(path.join(__dirname)));

// Initialize Gemini SDK securely using Render's environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Live Altra AI Endpoint
app.post('/api/altra-ai-chat', async (req, res) => {
    try {
       const prompt = req.body.message || req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
            {
                role: 'user',
                parts: [{ text: "You are AltraAI, a professional business automation assistant for Krishnyansh Zenova Peak Tech Hub. Your goal is to answer questions about our tech and automation services, and politely ask visitors for their name and phone number so our team can follow up." }]
            },
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ]
    });

     const aiText = response.text || (response.candidates && response.candidates[0].content.parts[0].text) || "Got it! How else can I help?";
res.json({ reply: aiText });   
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Altra AI backend is currently busy. Please try again." });
    }
});

// Fallback route to serve index.html for main web traffic
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Zenova Peak Tech Hub server is running live on port ${PORT}`);
});
