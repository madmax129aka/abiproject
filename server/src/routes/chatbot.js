const express = require('express');
const auth = require('../middleware/auth');
const { chatbotReply } = require('../services/claude');

const router = express.Router();

// POST /api/chatbot/message
router.post('/message', auth, async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Messages array is required' 
      });
    }

    const reply = await chatbotReply(messages);

    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
