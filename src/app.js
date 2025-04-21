const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { config } = require('./config/config');
const routes = require('./api/routes');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));

// Mount API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Close database connections, RabbitMQ connections, etc.
  process.exit(0);
});

module.exports = app;
