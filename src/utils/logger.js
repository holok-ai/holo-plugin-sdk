const winston = require('winston');
// We'll get the config in the format function to avoid circular dependencies

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Create custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      // Get server ID safely for distributed tracing
      let serverId = 'unknown';
      try {
        // Dynamically load config to avoid circular dependencies
        const { config } = require('../config/config');
        serverId = config.server?.id || 'unknown';
      } catch (e) {
        // Ignore errors, use default serverId
      }
      return `${info.timestamp} ${info.level}: [${serverId}] ${info.message}`;
    }
  )
);

// Define which transports the logger should use
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  
  // File transport for all logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;
