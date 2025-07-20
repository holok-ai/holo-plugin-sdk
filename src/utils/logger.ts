const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || 'logs';

// Create logs directory if it doesn't exist
try {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, {recursive: true});
    }
} catch (error) {
    console.warn(`Warning: Could not create logs directory: ${(error as Error).message}`);
    console.warn('Logging to console only');
}

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
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    winston.format.colorize({all: true}),
    winston.format.printf(
        (info: any) => {
            // Get server ID safely for distributed tracing
            let serverId = 'unknown';
            try {
                // Dynamically load config to avoid circular dependencies
                const {config} = require('../config/config');
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
    new winston.transports.Console()
];

// Add file transports only if we can access the logs directory
try {
    // Test if we can write to the logs directory
    fs.accessSync(logDir, fs.constants.W_OK);

    // File transport for errors
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
        })
    );

    // File transport for all logs
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'all.log')
        })
    );
} catch (error) {
    console.warn(`Warning: Could not access logs directory for writing: ${(error as Error).message}`);
    console.warn('Logging to console only');
}

// Determine log level based on environment
const level = (): string => {
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

export default logger;
