const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config/config');
const logger = require('../../utils/logger');
const queueProducer = require('../../queue/producer');
const { createResponseStream } = require('../../utils/response-controller');
const llmFactory = require('../../llm/factory');

/**
 * Generate text from a prompt (Ollama compatible endpoint)
 */
const generateText = async (req, res) => {
  try {
    const { model, prompt, options } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({
        error: {
          message: 'Model and prompt are required'
        }
      });
    }
    
    // Generate a unique ID for this request
    const requestId = uuidv4();
    
    // Format the request for the worker
    const request = {
      id: requestId,
      type: 'generate',
      payload: {
        model,
        prompt,
        options: options || {}
      },
      timestamp: Date.now()
    };
    
    logger.info(`New generate request: ${requestId} for model: ${model}`);
    
    // Set up server-sent events for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create a response stream
    const responseStream = await createResponseStream(requestId);
    
    // Handle client disconnect
    req.on('close', () => {
      logger.info(`Client disconnected from request: ${requestId}`);
      if (responseStream) responseStream.end();
    });
    
    // First send the request to the queue
    await queueProducer.sendToQueue(
      config.rabbitMq.queues.llmRequests,
      request,
      { correlationId: requestId }
    );
    
    // Then start the streaming response AFTER the request has been queued
    // Pipe the response stream to the client
    responseStream.pipe(res);
    
    // Write a comment to keep connection alive
    //res.write(':keepalive\n\n');
  } catch (error) {
    logger.error(`Error in generateText: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Failed to process request'
        }
      });
    }
  }
};

/**
 * Chat completion (OpenAI/Ollama compatible endpoint)
 */
const chatCompletion = async (req, res) => {
  try {
    const { model, messages, options, stream = true } = req.body;
    logger.info("request body: "+JSON.stringify(req.headers));
    
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: {
          message: 'Model and messages array are required'
        }
      });
    }
    
    // Generate a unique ID for this request
    const requestId = uuidv4();
    
    // Format the request for the worker
    const request = {
      id: requestId,
      type: 'chat',
      payload: {
        model,
        messages,
        options: options || {},
        stream
      },
      timestamp: Date.now()
    };
    
    logger.info(`New chat request: ${requestId} for model: ${model}`);
    
    let responseStream;
    
    // Set up streaming or regular JSON response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Create a response stream
      responseStream = await createResponseStream(requestId);
      
      // Handle client disconnect
      req.on('close', () => {
        logger.info(`Client disconnected from request: ${requestId}`);
        if (responseStream) responseStream.end();
      });
    }
    
    // First send the request to the queue
    await queueProducer.sendToQueue(
      config.rabbitMq.queues.llmRequests,
      request,
      { correlationId: requestId }
    );
    
    // Then start the streaming response AFTER the request has been queued
    if (stream && responseStream) {
      // Pipe the response stream to the client
      responseStream.pipe(res);
      
      // Write a comment to keep connection alive
      //res.write(':keepalive\n\n');
    }
    
    // If not streaming, wait for complete response
    if (!stream) {
      // TODO: Implement non-streaming response handling
      // This would involve waiting for a complete response from a separate queue
      // For now, return a stubbed response
      return res.status(501).json({
        error: {
          message: 'Non-streaming responses not yet implemented'
        }
      });
    }
  } catch (error) {
    logger.error(`Error in chatCompletion: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Failed to process request'
        }
      });
    }
  }
};

/**
 * List available models
 */
const listModels = async (req, res) => {
  try {
    // Fetch models from the configured provider
    const models = await llmFactory.getModels();
    
    return res.status(200).json({ models });
  } catch (error) {
    logger.error(`Error in listModels: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to list models'
      }
    });
  }
};

/**
 * Get proxy system status
 */
const getStatus = async (req, res) => {
  try {
    // In a real implementation, this would fetch actual system status
    const status = {
      status: 'ok',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(status);
  } catch (error) {
    logger.error(`Error in getStatus: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to get status'
      }
    });
  }
};

/**
 * Get queue status
 */
const getQueueStatus = async (req, res) => {
  try {
    // In a real implementation, this would fetch actual queue metrics
    // For now, we'll return a mock response
    const queueStatus = {
      activeWorkers: 3,
      pendingRequests: 2,
      processedLast24h: 150,
      averageProcessingTime: 2500, // ms
      timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(queueStatus);
  } catch (error) {
    logger.error(`Error in getQueueStatus: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to get queue status'
      }
    });
  }
};

module.exports = {
  generateText,
  chatCompletion,
  listModels,
  getStatus,
  getQueueStatus
};
