const Message = require("../models/Message");
const { getBotResponse } = require("../services/chatbotService");

const axios = require("axios");

const handleChatbotMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res
        .status(400)
        .json({ error: "User ID and message are required" });
    }

    // Send message to chatbot API
    const response = await axios.post(
      "https://chatbot-green-grass-2359-production-806c.up.railway.app/chat",
      {
        message,
      }
    );
    const botResponse = response.data.response;

    // Save to DB in a separate async process
    Message.create({ userId, userMessage: message, botResponse });

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Error processing chatbot request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all chat history
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request params

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const messages = await Message.find({ userId }).sort({ createdAt: 1 }); // Sort oldest to newest
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { handleChatbotMessage, getChatHistory };
