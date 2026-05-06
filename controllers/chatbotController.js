const Message = require("../models/Message");
const axios = require("axios");

// Priority order: Groq (fastest) → Google AI Studio (fallback)
const PROVIDERS = [
  {
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile", // or "llama3-8b-8192" for even faster
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
  {
    name: "google",
    url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: "gemini-2.0-flash",
    headers: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
  },
];

const SYSTEM_PROMPT =
  "You are VetVision, an animal care specialist focused on cows and livestock. Provide brief, accurate, educational information only. Never diagnose or prescribe treatments. Use 2-3 short sentences max per response. Include a disclaimer for serious issues.";

async function callLLM(message) {
  for (const provider of PROVIDERS) {
    if (!provider.apiKey) continue;
    try {
      const response = await axios.post(
        provider.url,
        {
          model: provider.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          max_tokens: 120,
          temperature: 0.7,
        },
        {
          headers: provider.headers(provider.apiKey),
          timeout: 8000, // fail fast, try next provider
        },
      );
      return response.data.choices[0].message.content;
    } catch (err) {
      console.warn(`[${provider.name}] failed:`, err.message);
      // continue to next provider
    }
  }
  throw new Error("All providers failed");
}

const handleChatbotMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res
        .status(400)
        .json({ error: "User ID and message are required" });
    }

    const botResponse = await callLLM(message);

    // Save to DB without blocking response
    Message.create({ userId, userMessage: message, botResponse }).catch((err) =>
      console.error("DB save failed:", err),
    );

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "Internal server error",
      response:
        "VetVision is currently unavailable. Please try again later or consult a local veterinarian for urgent concerns.",
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const messages = await Message.find({ userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { handleChatbotMessage, getChatHistory };
