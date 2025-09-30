import 'reflect-metadata';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import {env} from "../env";
import {container, InjectionToken} from "tsyringe";

// Ensure logs directory exists
const logDir = env.logDir;

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

export function createLoggerFormat(serverId: string) {
    return winston.format.combine(
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
        winston.format.colorize({all: true}),
        winston.format.printf((info) => {
            const cls = info.className ? `[${info.className}]` : '';
            const mth = info.methodName ? `[${info.methodName}]` : '';
            const requestId = info.requestId ? `[RequestId: ${info.requestId}]` : '';
            return `${info.timestamp} ${info.level}: [${serverId}]${cls}${mth}${requestId} ${info.message}`;
        })
    );
}

// Define which transports the logger should use
const transports: any[] = [
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
    return env.NODE_ENV === 'development' ? 'debug' : 'info';
};

export function createLoggerOptions(serverId: string) {
    return {
        level: level(),
        levels,
        format: createLoggerFormat(serverId),
        transports,
    }
}

// Create the logger
const logger = winston.createLogger(
    createLoggerOptions(env.id)
);

export const LoggerFactoryToken: InjectionToken<(cls: Function) => winston.Logger> = 'LoggerFactory';

container.register(LoggerFactoryToken, {
    useFactory: () => (cls: Function) => logger.child({className: cls.name})
});

export default logger;
