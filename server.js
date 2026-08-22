const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini SDK with environment key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Live Altra AI Endpoint replacing dummy logic
app.post('/api/altra-ai-chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Altra AI backend is currently processing high traffic. Please try again." });
    }
});

app.listen(3000, () => {
    console.log('Zenova Peak Tech Hub server running live on port 3000');
});
