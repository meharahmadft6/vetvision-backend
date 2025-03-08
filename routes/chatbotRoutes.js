const express = require("express");
const router = express.Router();
const {
  handleChatbotMessage,
  getChatHistory,
} = require("../controllers/chatbotController");

router.post("/", handleChatbotMessage); // Send message & get bot response
router.get("/history/:userId", getChatHistory); // Fetch chat history for a specific user

module.exports = router;
