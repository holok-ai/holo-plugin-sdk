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
   * Create the audit table if it doesn't exist
   */
  async _createAuditTable() {
    try {
      const createTableSQL = `
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
      
      await this.pgPool.query(createTableSQL);
      logger.info('Audit table created or already exists');
    } catch (error) {
      logger.error(`Error creating audit table: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start consuming messages from the audit queue
   */
  async _startConsuming() {
    try {
      logger.info(`Starting to consume messages from audit queue: ${config.rabbitMq.queues.llmAudit}`);
      
      // Start consuming messages
      await this.channel.consume(config.rabbitMq.queues.llmAudit, async (message) => {
        if (!message) {
          logger.warn('Received null message in audit queue, ignoring');
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          const { id, type, sourceId, payload, timestamp } = content;
          
          logger.debug(`Received audit message for request: ${id}`);
          
          // Insert into PostgreSQL
          await this._logToDatabase(content);
          
          // Acknowledge the message
          this.channel.ack(message);
          logger.debug(`Successfully logged audit for request: ${id}`);
        } catch (error) {
          logger.error(`Error processing audit message: ${error.message}`);
          
          // In case of processing error, we'll nack without requeue after multiple failures
          // This is to prevent endless reprocessing of problematic messages
          if (message.fields.redelivered) {
            // Message has been redelivered, indicating previous failures
            this.channel.nack(message, false, false);
            logger.warn(`Rejected problematic audit message after redelivery`);
          } else {
            // First failure, requeue for retry
            this.channel.nack(message, false, true);
            logger.info('Audit message requeued for retry');
          }
        }
      }, { noAck: false }); // Manual acknowledgment
      
      logger.info(`Successfully started consuming from audit queue`);
    } catch (error) {
      logger.error(`Error setting up audit consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log a request to the PostgreSQL database
   * @param {object} request - The request object
   */
  async _logToDatabase(request) {
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
      logger.error(`Error inserting audit record: ${error.message}`);
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
