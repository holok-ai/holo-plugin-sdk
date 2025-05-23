const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { config } = require('./config/config');
const routes = require('./api/routes');
const logger = require('./utils/logger');
// Import and initialize response controller and model registry
const { createResponseStream } = require('./utils/response-controller');
const modelRegistry = require('./models/model-registry');

// Initialize Express app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));

// Option 1: Disable CORS for local development by adding these headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Serve static files from the public directory
app.use(express.static('src/public'));

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

// Initialize app with async components
async function initApp() {
  try {
    // Initialize response controller (this sets up the consumer)
    await createResponseStream('init');
    logger.info('Response controller initialized successfully');
    
    // Initialize model registry
    await modelRegistry.initialize();
    logger.info('Model registry initialized successfully');
    
    // Start the HTTP server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to initialize application: ${error.message}`);
    process.exit(1);
  }
}

// Start the application
initApp();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // Close database connections, RabbitMQ connections, etc.
  await modelRegistry.shutdown();
  logger.info('Closed model registry connections');
  process.exit(0);
});

module.exports = app;
