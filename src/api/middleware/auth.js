const logger = require('../../utils/logger');

/**
 * Basic authentication middleware
 * In a production environment, this should be replaced with a more robust solution
 */
const authMiddleware = (req, res, next) => {
  // Get authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // For development convenience, allow no auth in dev mode
    if (process.env.NODE_ENV === 'development') {
      logger.warn('No authorization header provided in development mode');
      return next();
    }
    
    return res.status(401).json({
      error: {
        message: 'Authorization header required'
      }
    });
  }

  // Check for Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);
    
    // In production, validate the token against your auth service
    // For now, we'll just do a simple check
    if (token === process.env.API_TOKEN || process.env.NODE_ENV === 'development') {
      return next();
    }
  }

  // Authentication failed
  return res.status(401).json({
    error: {
      message: 'Invalid authorization token'
    }
  });
};

module.exports = authMiddleware;
