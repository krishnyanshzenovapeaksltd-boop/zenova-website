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

// Leads storage array (if not already defined near the top)
let leads = [];

// Live Altra AI Endpoint
app.post('/api/altra-ai-chat', async (req, res) => {
    try {
        const prompt = req.body.message || req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        // Automatic lead detection: if user types contact details or phone number
        if (prompt.length > 5 && (prompt.includes('@') || /\d{7,}/.test(prompt))) {
            leads.push({
                info: prompt,
                date: new Date().toLocaleDateString(),
                source: "Altra AI Chat Widget"
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: "You are AltraAI, a professional business automation assistant for Krishnyansh Zenova Peak Tech Hub. Answer questions about our tech and automation services, and politely ask visitors for their name and phone number so our team can follow up." }]
                },
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        });

        const replyText = response.text || "Hello! How can I help your business?";
        res.json({ reply: replyText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ reply: "Sorry, I am having trouble connecting right now. Please try again!" });
    }
});
