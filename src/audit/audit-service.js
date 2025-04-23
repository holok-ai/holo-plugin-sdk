const { Pool } = require('pg');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const rabbitMQConnection = require('../queue/connection');

/**
 * Audit service for logging LLM requests to PostgreSQL
 */
class AuditService {
  constructor() {
    this.channel = null;
    this.initialized = false;
    this.pgPool = null;
  }

  /**
   * Initialize the audit service
   */
  async init() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize PostgreSQL connection
      this.pgPool = new Pool({
        host: config.audit.postgres.host,
        port: config.audit.postgres.port,
        database: config.audit.postgres.database,
        user: config.audit.postgres.user,
        password: config.audit.postgres.password,
        max: 20, // Max number of clients in the pool
        idleTimeoutMillis: 30000
      });
      
      // Test the database connection
      await this.pgPool.query('SELECT NOW()');
      logger.info('Successfully connected to PostgreSQL for audit logging');
      
      // Create the audit table if it doesn't exist
      await this._createAuditTable();
      
      // Initialize RabbitMQ channel
      this.channel = await rabbitMQConnection.getChannel();
      
      // Start consuming from the audit queue
      await this._startConsuming();
      
      this.initialized = true;
      logger.info('Audit service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize audit service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create the audit tables if they don't exist
   */
  async _createAuditTable() {
    try {
      // Create request audit table
      const createRequestTableSQL = `
        CREATE TABLE IF NOT EXISTS llm_request_audit (
          id SERIAL PRIMARY KEY,
          request_id VARCHAR(36) NOT NULL,
          request_type VARCHAR(50) NOT NULL,
          model VARCHAR(100) NOT NULL,
          prompt TEXT,
          options JSONB,
          source_id VARCHAR(100),
          user_id VARCHAR(100),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          metadata JSONB
        );
      `;
      
      await this.pgPool.query(createRequestTableSQL);
      
      // Create response audit table
      const createResponseTableSQL = `
        CREATE TABLE IF NOT EXISTS llm_response_audit (
          id SERIAL PRIMARY KEY,
          request_id VARCHAR(36) NOT NULL,
          response_type VARCHAR(50) NOT NULL,
          token TEXT,
          model VARCHAR(100),
          worker_id VARCHAR(100),
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          is_final BOOLEAN DEFAULT FALSE,
          total_tokens INTEGER,
          processing_time INTEGER,
          tokens_per_second FLOAT,
          metadata JSONB
        );
        
        -- Create index on request_id for faster joins
        CREATE INDEX IF NOT EXISTS idx_response_request_id ON llm_response_audit(request_id);
      `;
      
      await this.pgPool.query(createResponseTableSQL);
      
      logger.info('Audit tables created or already exist');
    } catch (error) {
      logger.error(`Error creating audit tables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start consuming messages from the audit queues
   */
  async _startConsuming() {
    try {
      // 1. Start consuming from the request audit queue
      logger.info(`Starting to consume messages from request audit queue: ${config.rabbitMq.queues.llmAudit}`);
      
      await this.channel.consume(config.rabbitMq.queues.llmAudit, async (message) => {
        if (!message) {
          logger.warn('Received null message in request audit queue, ignoring');
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          const { id, type, sourceId, payload, timestamp } = content;
          
          logger.debug(`Received audit message for request: ${id}`);
          
          // Insert into PostgreSQL
          await this._logRequestToDatabase(content);
          
          // Acknowledge the message
          this.channel.ack(message);
          logger.debug(`Successfully logged audit for request: ${id}`);
        } catch (error) {
          logger.error(`Error processing request audit message: ${error.message}`);
          
          // In case of processing error, we'll nack without requeue after multiple failures
          if (message.fields.redelivered) {
            this.channel.nack(message, false, false);
            logger.warn(`Rejected problematic request audit message after redelivery`);
          } else {
            this.channel.nack(message, false, true);
            logger.info('Request audit message requeued for retry');
          }
        }
      }, { noAck: false }); // Manual acknowledgment
      
      // 2. Start consuming from the response audit queue
      logger.info(`Starting to consume messages from response audit queue: ${config.rabbitMq.queues.llmResponsesAudit}`);
      
      await this.channel.consume(config.rabbitMq.queues.llmResponsesAudit, async (message) => {
        if (!message) {
          logger.warn('Received null message in response audit queue, ignoring');
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          const { requestId, type, timestamp, workerId } = content;
          
          // Skip processing if requestId is not present
          if (!requestId) {
            logger.warn('Received response audit message without requestId, ignoring');
            this.channel.ack(message);
            return;
          }
          
          logger.debug(`Received audit message for response: ${requestId}, type: ${type}`);
          
          // Insert into PostgreSQL
          await this._logResponseToDatabase(content);
          
          // Acknowledge the message
          this.channel.ack(message);
          
          if (type === 'done') {
            logger.info(`Successfully logged final response for request: ${requestId}`);
          } else {
            logger.debug(`Successfully logged response token for request: ${requestId}`);
          }
        } catch (error) {
          logger.error(`Error processing response audit message: ${error.message}`);
          
          // In case of processing error, we'll nack without requeue after multiple failures
          if (message.fields.redelivered) {
            this.channel.nack(message, false, false);
            logger.warn(`Rejected problematic response audit message after redelivery`);
          } else {
            this.channel.nack(message, false, true);
            logger.info('Response audit message requeued for retry');
          }
        }
      }, { noAck: false }); // Manual acknowledgment
      
      logger.info(`Successfully started consuming from both audit queues`);
    } catch (error) {
      logger.error(`Error setting up audit consumers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log a request to the PostgreSQL database
   * @param {object} request - The request object
   */
  async _logRequestToDatabase(request) {
    const { id, type, sourceId, payload, timestamp } = request;
    const { model, prompt, messages, options } = payload;
    
    // For 'chat' type requests, use the first message as the prompt for audit purposes
    const promptText = prompt || (messages && messages.length > 0 
      ? messages[messages.length - 1].content 
      : null);
    
    // Get user ID from options or metadata if available
    const userId = (options && options.user) || null;
    
    // Prepare statement with parameterized query for security
    const query = `
      INSERT INTO llm_request_audit (
        request_id, request_type, model, prompt, options, source_id, user_id, timestamp, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    const params = [
      id,
      type,
      model,
      promptText,
      JSON.stringify(options || {}),
      sourceId,
      userId,
      new Date(timestamp),
      JSON.stringify({
        fullRequest: request
      })
    ];
    
    try {
      await this.pgPool.query(query, params);
    } catch (error) {
      logger.error(`Error inserting request audit record: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Log a response to the PostgreSQL database
   * @param {object} response - The response object
   */
  async _logResponseToDatabase(response) {
    const { requestId, type, token, model, workerId, timestamp } = response;
    
    // Handle different response types
    const isFinalResponse = (type === 'done' || response.done === true);
    let totalTokens = null;
    let processingTime = null;
    let tokensPerSecond = null;
    
    // Extract metrics if this is a final message
    if (isFinalResponse) {
      logger.debug(`Processing final response for ${requestId}: ${JSON.stringify(response, null, 2)}`);
      
      // Format 1: Our internally added metrics
      if (response.metrics) {
        totalTokens = response.metrics.totalTokens;
        processingTime = response.metrics.processingTime;
        tokensPerSecond = response.metrics.tokensPerSecond;
      }
      
      // Format 2: Standard Ollama response format directly in response
      if (response.total_duration) {
        // Convert nanoseconds to milliseconds
        processingTime = Math.round(response.total_duration / 1000000);
        
        // Add up prompt and response tokens
        const promptTokens = response.prompt_eval_count || 0;
        const responseTokens = response.eval_count || 0;
        totalTokens = promptTokens + responseTokens;
        
        // Calculate tokens per second if we have duration
        if (response.eval_duration && responseTokens > 0) {
          // Convert nanoseconds to seconds and calculate
          const evalDurationSeconds = response.eval_duration / 1000000000;
          tokensPerSecond = responseTokens / evalDurationSeconds;
        }
      }
      
      // Format 3: Check if metrics are in the response field (common Ollama pattern)
      if (response.response && typeof response.response === 'object') {
        if (response.response.total_duration) {
          processingTime = Math.round(response.response.total_duration / 1000000);
          
          const promptTokens = response.response.prompt_eval_count || 0;
          const responseTokens = response.response.eval_count || 0;
          totalTokens = promptTokens + responseTokens;
          
          if (response.response.eval_duration && responseTokens > 0) {
            const evalDurationSeconds = response.response.eval_duration / 1000000000;
            tokensPerSecond = responseTokens / evalDurationSeconds;
          }
        }
      }
      
      // Format 4: Check for Ollama structure in fullResponse field (from worker format)
      if (response.fullResponse && typeof response.fullResponse === 'object') {
        const fullData = response.fullResponse;
        if (fullData.total_duration) {
          processingTime = Math.round(fullData.total_duration / 1000000);
          
          const promptTokens = fullData.prompt_eval_count || 0;
          const responseTokens = fullData.eval_count || 0;
          totalTokens = promptTokens + responseTokens;
          
          if (fullData.eval_duration && responseTokens > 0) {
            const evalDurationSeconds = fullData.eval_duration / 1000000000;
            tokensPerSecond = responseTokens / evalDurationSeconds;
          }
        }
      }
      
      // Log that we found/didn't find metrics for debugging
      if (totalTokens !== null || processingTime !== null) {
        logger.info(`Extracted metrics for request ${requestId}: tokens=${totalTokens}, time=${processingTime}ms, rate=${tokensPerSecond?.toFixed(2) || 'unknown'} tokens/sec`);
      } else {
        logger.warn(`No metrics found in final response for request ${requestId}`);
        // Log the actual structure for debugging
        logger.debug(`Response structure: ${JSON.stringify(response)}`);
      }
    }
    
    // Prepare statement with parameterized query for security
    const query = `
      INSERT INTO llm_response_audit (
        request_id, response_type, token, model, worker_id, timestamp, 
        is_final, total_tokens, processing_time, tokens_per_second, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    
    // Determine the best values for each parameter by checking multiple possible locations
    const finalRequestId = requestId || response.requestId;
    const finalType = type || (response.done ? 'done' : 'token');
    const finalToken = (type === 'token' ? token : null) || response.response || null;
    const finalModel = model || response.model;
    const finalWorkerId = workerId || response.workerId || 'unknown';
    
    const params = [
      finalRequestId,
      finalType,
      finalToken,
      finalModel,
      finalWorkerId,
      new Date(timestamp || Date.now()),
      isFinalResponse,
      totalTokens,
      processingTime, 
      tokensPerSecond,
      JSON.stringify({
        fullResponse: response
      })
    ];
    
    try {
      await this.pgPool.query(query, params);
    } catch (error) {
      logger.error(`Error inserting response audit record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Shutdown the audit service
   */
  async shutdown() {
    if (this.channel) {
      try {
        await this.channel.cancel();
        logger.info('Stopped consuming audit messages');
      } catch (error) {
        logger.error(`Error stopping audit consumer: ${error.message}`);
      }
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
      logger.info('Closed PostgreSQL connection pool');
    }
  }
}

// Create a singleton instance
const auditService = new AuditService();

module.exports = auditService;
