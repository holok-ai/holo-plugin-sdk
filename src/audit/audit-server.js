const logger = require('../utils/logger');
const auditService = require('./audit-service');

/**
 * Start the audit service
 */
async function startAuditService() {
  try {
    // Initialize the audit service
    await auditService.init();
    logger.info('Audit service started successfully');
    
    // Handle shutdown signals
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down audit service gracefully');
      await auditService.shutdown();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down audit service gracefully');
      await auditService.shutdown();
      process.exit(0);
    });
    
    // Keep the process running
    logger.info('Audit service is running, waiting for LLM request events');
  } catch (error) {
    logger.error(`Failed to start audit service: ${error.message}`);
    process.exit(1);
  }
}

// Start the service
startAuditService();
