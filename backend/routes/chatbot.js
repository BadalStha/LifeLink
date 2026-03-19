import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/', async (req, res) => {
    const { message, history, language } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'AI Chatbot is currently unavailable (Missing API Key). Please contact the administrator.' });
        }

        // Initialize Gemini SDK
        const ai = new GoogleGenAI({ apiKey });

        let systemInstruction = `You are a helpful, empathetic AI assistant for a blood and organ donation platform called "LifeLink". 
Your purpose is to help users navigate the platform, understand the importance of blood and organ donation, and provide general information about the donation process safely and kindly. 
Keep your answers relatively brief, clear, and encouraging.
If a user asks about specific medical advice, emphasize that you are an AI and they should consult a medical professional.`;

        if (language === 'ne') {
            systemInstruction += `\n\nCRITICAL INSTRUCTION: You must reply entirely in the Nepali language (Devanagari script). Ensure the tone is polite and helpful.`;
        } else {
            systemInstruction += `\n\nCRITICAL INSTRUCTION: You must reply entirely in English.`;
        }

        // Format history if provided by frontend
        const formattedHistory = Array.isArray(history) ? history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        })) : [];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...formattedHistory,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: systemInstruction,
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error('Chatbot API Error:', error);
        res.status(500).json({ error: 'Failed to generate a response from the AI.' });
    }
});

export default router;
