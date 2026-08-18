app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.log("ERROR: GEMINI_API_KEY is missing in environment variables!");
            return res.status(500).json({ reply: "API Key missing on server." });
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
        
        // Console mein response print karke check karein ki Google kya bhej raha hai
        console.log("Gemini Response Data:", JSON.stringify(data));

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            return res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            return res.json({ reply: "AI received the message but returned an unexpected format." });
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ reply: "AI Server Connection Error." });
    }
});
