const { v4: uuidv4 } = require('uuid');
const { config } = require('../../config/config');
const logger = require('../../utils/logger');
const queueProducer = require('../../queue/producer');
const { createResponseStream } = require('../../utils/response-controller');
const llmFactory = require('../../llm/factory');

/**
 * Generate text from a prompt (compatible with multiple providers)
 */
const generateText = async (req, res) => {
  try {
    const { model, prompt, options, stream, provider } = req.body;
    
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
      sourceId: config.server.id, // Add server ID for response routing
      payload: {
        model,
        prompt,
        stream,
        provider, // Pass provider if specified
        options: options || {}
      },
      timestamp: Date.now()
    };
    
    logger.info(`New generate request: ${requestId} for model: ${model} streaming:${stream}`);
    
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
    
    // Send the request to the exchange instead of directly to the queue
    // This allows multiple consumers (main processor and audit logger) to receive the message
    await queueProducer.sendToExchange(
      config.rabbitMq.exchanges.llmRequests,
      '', // Empty routing key for fanout exchange
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
 * Chat completion (compatible with multiple providers)
 */
const chatCompletion = async (req, res) => {
  try {
    const { model, messages, options, stream, provider } = req.body;
    
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
      sourceId: config.server.id, // Add server ID for response routing
      payload: {
        model,
        messages,
        provider, // Pass provider if specified
        options: options || {},
        stream
      },
      timestamp: Date.now()
    };
    
    logger.info(`New chat request: ${requestId} for model: ${model} streaming:${stream}`);
    
    let responseStream;
    
    // Set up streaming or regular JSON response 
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
  
    // Send the request to the exchange instead of directly to the queue
    // This allows multiple consumers (main processor and audit logger) to receive the message
    await queueProducer.sendToExchange(
      config.rabbitMq.exchanges.llmRequests,
      '', // Empty routing key for fanout exchange
      request,
      { correlationId: requestId }
    );
    
    // Then start the streaming response AFTER the request has been queued
    // Pipe the response stream to the client
    responseStream.pipe(res);
    
    // Write a comment to keep connection alive
    //res.write(':keepalive\n\n');
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
    const { provider } = req.query;
    
    // Fetch models from the specified provider or default
    const models = await llmFactory.getModels(provider);
    
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
 * List OpenAI models - OpenAI compatible format
 */
const listOpenAIModels = async (req, res) => {
  try {
    // Fetch models from OpenAI provider
    const models = await llmFactory.getModels('openai');
    
    // Format in OpenAI style
    const formattedModels = {
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: new Date(model.modified_at).getTime() / 1000,
        owned_by: 'organization-owner'
      }))
    };
    
    return res.status(200).json(formattedModels);
  } catch (error) {
    logger.error(`Error in listOpenAIModels: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to list models',
        type: 'server_error'
      }
    });
  }
};

/**
 * List Claude models - Anthropic compatible format
 */
const listClaudeModels = async (req, res) => {
  try {
    // Fetch models from Claude provider
    const models = await llmFactory.getModels('claude');
    
    // Return in Anthropic style
    return res.status(200).json({ models });
  } catch (error) {
    logger.error(`Error in listClaudeModels: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to list models',
        type: 'server_error'
      }
    });
  }
};

/**
 * List available providers
 */
const listProviders = async (req, res) => {
  try {
    // Get list of available providers
    const providers = llmFactory.getAvailableProviders();
    
    return res.status(200).json({ providers });
  } catch (error) {
    logger.error(`Error in listProviders: ${error.message}`);
    return res.status(500).json({
      error: {
        message: 'Failed to list providers'
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

/**
 * OpenAI-compatible chat completions endpoint
 */
const openAIChatCompletion = async (req, res) => {
  try {
    // Get the body and add provider parameter
    const requestBody = {
      ...req.body,
      provider: 'openai'
    };
    
    // Set the request with the provider
    req.body = requestBody;
    
    // Call the standard chat completion with the provider set
    return chatCompletion(req, res);
  } catch (error) {
    logger.error(`Error in openAIChatCompletion: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Failed to process OpenAI request'
        }
      });
    }
  }
};

/**
 * Claude-compatible messages endpoint
 */
const claudeMessages = async (req, res) => {
  try {
    // Get the body and add provider parameter
    const requestBody = {
      ...req.body,
      provider: 'claude'
    };
    
    // Set the request with the provider
    req.body = requestBody;
    
    // Call the standard chat completion with the provider set
    return chatCompletion(req, res);
  } catch (error) {
    logger.error(`Error in claudeMessages: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Failed to process Claude request'
        }
      });
    }
  }
};

module.exports = {
  generateText,
  chatCompletion,
  openAIChatCompletion,
  claudeMessages,
  listModels,
  listOpenAIModels,
  listClaudeModels,
  listProviders,
  getStatus,
  getQueueStatus
};
