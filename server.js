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
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        res.json({ reply: response.text });
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
