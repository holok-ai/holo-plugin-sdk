const { Pool } = require('pg');
const { config } = require('../../config/config');
const logger = require('../../utils/logger');
const consumer = require('../../queue/consumer');
const producer = require('../../queue/producer');

/**
 * Class for monitoring and dashboard metrics
 */
class MonitoringService {
  constructor() {
    this.pgPool = null;
    this.initialized = false;
  }

  /**
   * Initialize monitoring service
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
      logger.info('Successfully connected to PostgreSQL for monitoring');
      
      this.initialized = true;
    } catch (error) {
      logger.error(`Failed to initialize monitoring service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the current queue depth metrics
   */
  async getQueueMetrics() {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.init();
      }

      // Use RabbitMQ management API or direct channel operations to get queue depth
      // For now, return placeholder data
      return {
        queueDepth: await this._getQueueDepth(),
        requestsProcessed: await this._getRequestsProcessedLastHour(),
        responseTime: await this._getAvgResponseTime(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error fetching queue metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the queue depth from RabbitMQ
   * @private
   */
  async _getQueueDepth() {
    try {
      // This could use RabbitMQ management API for accurate metrics
      // For now, we'll return a placeholder
      return 0; // placeholder
    } catch (error) {
      logger.error(`Error fetching queue depth: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get the number of requests processed in the last hour
   * @private
   */
  async _getRequestsProcessedLastHour() {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM llm_request_audit 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `;
      
      const result = await this.pgPool.query(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error(`Error fetching processed requests: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get the average response time for requests
   * @private
   */
  async _getAvgResponseTime() {
    try {
      const query = `
        SELECT AVG(processing_time) as avg_time 
        FROM llm_response_audit 
        WHERE is_final = true 
          AND timestamp > NOW() - INTERVAL '1 hour'
      `;
      
      const result = await this.pgPool.query(query);
      return parseFloat(result.rows[0].avg_time) || 0;
    } catch (error) {
      logger.error(`Error fetching average response time: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get recent LLM requests with their responses
   */
  async getRecentRequests(limit = 10) {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.init();
      }

      const query = `
        SELECT 
          r.request_id, 
          r.request_type, 
          r.model, 
          r.prompt, 
          r.timestamp as request_time,
          r.source_id,
          p.is_final,
          p.total_tokens,
          p.processing_time,
          p.tokens_per_second,
          p.timestamp as response_time
        FROM 
          llm_request_audit r
        LEFT JOIN 
          llm_response_audit p ON r.request_id = p.request_id AND p.is_final = true
        ORDER BY 
          r.timestamp DESC
        LIMIT $1
      `;
      
      const result = await this.pgPool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching recent requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get worker performance metrics
   */
  async getWorkerMetrics() {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.init();
      }

      const query = `
        SELECT 
          worker_id,
          COUNT(*) as requests_processed,
          AVG(processing_time) as avg_processing_time,
          AVG(total_tokens) as avg_tokens,
          AVG(tokens_per_second) as avg_tokens_per_second
        FROM 
          llm_response_audit
        WHERE 
          is_final = true
          AND timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY 
          worker_id
        ORDER BY 
          requests_processed DESC
      `;
      
      const result = await this.pgPool.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching worker metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model usage statistics
   */
  async getModelMetrics() {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.init();
      }

      const query = `
        SELECT 
          r.model,
          COUNT(*) as request_count,
          AVG(p.processing_time) as avg_processing_time,
          AVG(p.total_tokens) as avg_tokens,
          AVG(p.tokens_per_second) as avg_tokens_per_second
        FROM 
          llm_request_audit r
        JOIN 
          llm_response_audit p ON r.request_id = p.request_id AND p.is_final = true
        WHERE 
          r.timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY 
          r.model
        ORDER BY 
          request_count DESC
      `;
      
      const result = await this.pgPool.query(query);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching model metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get request details by ID
   */
  async getRequestById(requestId) {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.init();
      }

      // Get request details
      const requestQuery = `
        SELECT * FROM llm_request_audit WHERE request_id = $1
      `;
      
      const requestResult = await this.pgPool.query(requestQuery, [requestId]);
      
      if (requestResult.rows.length === 0) {
        return null;
      }
      
      // Get response details
      const responseQuery = `
        SELECT * FROM llm_response_audit WHERE request_id = $1 ORDER BY timestamp ASC
      `;
      
      const responseResult = await this.pgPool.query(responseQuery, [requestId]);
      
      return {
        request: requestResult.rows[0],
        responses: responseResult.rows
      };
    } catch (error) {
      logger.error(`Error fetching request details: ${error.message}`);
      throw error;
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Controller functions

/**
 * Get dashboard data
 */
const getDashboardData = async (req, res) => {
  try {
    // Initialize if needed
    if (!monitoringService.initialized) {
      await monitoringService.init();
    }

    // Get all metrics in parallel
    const [queueMetrics, recentRequests, workerMetrics, modelMetrics] = await Promise.all([
      monitoringService.getQueueMetrics(),
      monitoringService.getRecentRequests(5),
      monitoringService.getWorkerMetrics(),
      monitoringService.getModelMetrics()
    ]);

    res.status(200).json({
      queueMetrics,
      recentRequests,
      workerMetrics,
      modelMetrics
    });
  } catch (error) {
    logger.error(`Error in getDashboardData: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'Failed to fetch dashboard data'
      }
    });
  }
};

/**
 * Get more detailed request history
 */
const getRequestHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const recentRequests = await monitoringService.getRecentRequests(limit);

    res.status(200).json({
      requests: recentRequests
    });
  } catch (error) {
    logger.error(`Error in getRequestHistory: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'Failed to fetch request history'
      }
    });
  }
};

/**
 * Get worker performance metrics
 */
const getWorkerPerformance = async (req, res) => {
  try {
    const workerMetrics = await monitoringService.getWorkerMetrics();

    res.status(200).json({
      workers: workerMetrics
    });
  } catch (error) {
    logger.error(`Error in getWorkerPerformance: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'Failed to fetch worker performance data'
      }
    });
  }
};

/**
 * Get detailed request information
 */
const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({
        error: {
          message: 'Request ID is required'
        }
      });
    }

    const requestDetails = await monitoringService.getRequestById(requestId);
    
    if (!requestDetails) {
      return res.status(404).json({
        error: {
          message: 'Request not found'
        }
      });
    }

    res.status(200).json(requestDetails);
  } catch (error) {
    logger.error(`Error in getRequestDetails: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'Failed to fetch request details'
      }
    });
  }
};

module.exports = {
  getDashboardData,
  getRequestHistory,
  getWorkerPerformance,
  getRequestDetails
};
