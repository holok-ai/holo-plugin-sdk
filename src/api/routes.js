const express = require('express');
const authMiddleware = require('./middleware/auth');
const llmController = require('./controllers/llm');
const monitoringController = require('./controllers/monitoring');
const modelsController = require('./controllers/models');
const workersController = require('./controllers/workers');

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

// Monitoring endpoints
router.get('/monitoring/dashboard', monitoringController.getDashboardData);
router.get('/monitoring/requests', monitoringController.getRequestHistory);
router.get('/monitoring/workers', monitoringController.getWorkerPerformance);
router.get('/monitoring/requests/:requestId', monitoringController.getRequestDetails);

// Model management endpoints
router.get('/admin/models', modelsController.getAllModels);
router.get('/admin/models/:id', modelsController.getModelById);
router.put('/admin/models/:id', modelsController.updateModel);
router.post('/admin/models/sync', modelsController.syncModels);

// Worker management endpoints
router.get('/admin/workers', workersController.getWorkerStatus);
router.get('/admin/workers/:workerId', workersController.getWorkerStatus);
router.post('/admin/workers/:workerId/command', workersController.sendWorkerCommand);

module.exports = router;
