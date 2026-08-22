const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Gemini SDK safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Storage arrays
let registrations = [];
let careerApplications = [];
let leads = [];

// Live Altra AI Endpoint
app.post('/api/altra-ai-chat', async (req, res) => {
    try {
        if (!ai) {
            return res.status(500).json({ reply: "Gemini API key is not configured on the server." });
        }

        const prompt = req.body.message || req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        // Automatic lead detection
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

// Registration Endpoint
app.post('/api/register', (req, res) => {
    const data = req.body;
    registrations.push({ ...data, date: new Date().toLocaleDateString() });
    res.json({ success: true, message: "Registration saved successfully!" });
});

// Career Endpoint
app.post('/api/career', (req, res) => {
    const data = req.body;
    careerApplications.push({ ...data, date: new Date().toLocaleDateString() });
    res.json({ success: true, message: "Career application submitted successfully!" });
});

// Admin Submissions Endpoint
app.get('/api/submissions', (req, res) => {
    res.json({
        registrations: registrations,
        careers: careerApplications,
        leads: leads
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
