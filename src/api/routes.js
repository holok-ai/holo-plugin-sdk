const express = require('express');
const authMiddleware = require('./middleware/auth');
const llmController = require('./controllers/llm');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Ollama-compatible API endpoints
router.post('/generate', llmController.generateText);
router.post('/chat', llmController.chatCompletion);
router.post('/chat/completions', llmController.chatCompletion); // OpenAI compatibility
router.get('/models', llmController.listModels);
router.get('/status', llmController.getStatus);

// Queue management endpoints (for internal use)
router.get('/queue/status', llmController.getQueueStatus);

module.exports = router;
