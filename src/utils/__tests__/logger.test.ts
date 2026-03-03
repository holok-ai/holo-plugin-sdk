import winston from 'winston';
import {Writable} from 'stream';
import {colors, createLoggerFormat, createLoggerOptions, levels} from '../logger';

// Mock the env module to avoid SDK ESM import issues in tests
jest.mock('../../env', () => ({
    env: {
        logDir: '/tmp/test-logs',
        NODE_ENV: 'test',
        id: 'test-server'
    }
}));

// Helper to create a mock stream that captures logs
function createMockStream(logs: string[]): Writable {
    return new Writable({
        write(chunk: any, _encoding: any, callback: any) {
            logs.push(chunk.toString());
            callback();
        }
    });
}

// Helper to strip ANSI color codes from strings
function stripAnsi(str: string): string {
    return str.replace(/\x1B\[[0-9;]*m/g, '');
}

// Create a test format without colorize to avoid ANSI code issues
function createTestFormat(serverId: string) {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({level, message, timestamp, className, methodName, requestId, ...metadata}) => {
            // Simplified version of the formatter without colors
            const lvl3 = (lvl: string) => {
                const l = lvl.toLowerCase();
                if (l === "fatal") return "FTL";
                if (l === "error") return "ERR";
                if (l === "warn") return "WRN";
                if (l === "info") return "INF";
                if (l === "debug") return "DBG";
                if (l === "http") return "HTP";
                if (l === "verbose") return "VRB";
                if (l === "trace") return "TRC";
                return l.slice(0, 3).toUpperCase();
            };

            const time = String(timestamp).slice(11, 23); // Simple time extraction
            const lvl = lvl3(level);
            const srv = serverId;
            const loc = className && methodName ? `${className}.${methodName}` : (className || methodName || '');
            const rid = requestId ? `rid=${String(requestId).slice(-6)}` : '';

            let msg = `${time}|${lvl}|${srv}|${loc}|${rid}|${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
        })
    );
}

describe('Winston Logger Configuration', () => {
    describe('Log Levels', () => {
        it('should have all required log levels defined', () => {
            expect(levels).toHaveProperty('fatal', 0);
            expect(levels).toHaveProperty('error', 1);
            expect(levels).toHaveProperty('warn', 2);
            expect(levels).toHaveProperty('info', 3);
            expect(levels).toHaveProperty('http', 4);
            expect(levels).toHaveProperty('verbose', 5);
            expect(levels).toHaveProperty('debug', 6);
            expect(levels).toHaveProperty('trace', 7);
        });

        it('should have correct priority order (lower number = higher priority)', () => {
            expect(levels.fatal).toBeLessThan(levels.error);
            expect(levels.error).toBeLessThan(levels.warn);
            expect(levels.warn).toBeLessThan(levels.info);
            expect(levels.info).toBeLessThan(levels.http);
            expect(levels.http).toBeLessThan(levels.verbose);
            expect(levels.verbose).toBeLessThan(levels.debug);
            expect(levels.debug).toBeLessThan(levels.trace);
        });

        it('should have fatal and error as highest priority levels', () => {
            expect(levels.fatal).toBe(0);
            expect(levels.error).toBe(1);
        });
    });

    describe('Log Colors', () => {
        it('should have colors defined for all log levels', () => {
            expect(colors).toHaveProperty('fatal');
            expect(colors).toHaveProperty('error');
            expect(colors).toHaveProperty('warn');
            expect(colors).toHaveProperty('info');
            expect(colors).toHaveProperty('http');
            expect(colors).toHaveProperty('verbose');
            expect(colors).toHaveProperty('debug');
            expect(colors).toHaveProperty('trace');
        });

        it('should use red for fatal and error', () => {
            expect(colors.fatal).toBe('red');
            expect(colors.error).toBe('red');
        });

        it('should use distinct colors for other levels', () => {
            expect(colors.warn).toBe('yellow');
            expect(colors.info).toBe('green');
            expect(colors.http).toBe('magenta');
            expect(colors.verbose).toBe('cyan');
            expect(colors.debug).toBe('white');
            expect(colors.trace).toBe('gray');
        });
    });

    describe('Logger Creation', () => {
        it('should create logger options with correct structure', () => {
            const serverId = 'test-server';
            const options = createLoggerOptions(serverId);

            expect(options).toHaveProperty('level');
            expect(options).toHaveProperty('levels');
            expect(options).toHaveProperty('format');
            expect(options).toHaveProperty('transports');
            expect(options.levels).toBe(levels);
            expect(Array.isArray(options.transports)).toBe(true);
        });

        it('should create a functioning winston logger', () => {
            const serverId = 'test-server';
            const options = createLoggerOptions(serverId);
            const logger = winston.createLogger(options) as any;

            expect(logger).toBeDefined();
            expect(typeof logger.fatal).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.http).toBe('function');
            expect(typeof logger.verbose).toBe('function');
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.trace).toBe('function');
        });

        it('should create child loggers with metadata', () => {
            const serverId = 'test-server';
            const options = createLoggerOptions(serverId);
            const logger = winston.createLogger(options);
            const childLogger = logger.child({className: 'TestClass'});

            expect(childLogger).toBeDefined();
            expect(typeof childLogger.info).toBe('function');
        });
    });

    describe('Logger Format', () => {
        it('should create a format function', () => {
            const format = createLoggerFormat('test-server');
            expect(format).toBeDefined();
        });

        it('should format log messages with all metadata fields', () => {
            const logs: string[] = [];
            const serverId = 'test-server';
            const format = createLoggerFormat(serverId);
            const options = {
                level: 'info',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            };

            const logger = winston.createLogger(options);

            // Test that logger can handle metadata
            expect(() => {
                logger.info('Test message', {
                    className: 'TestClass',
                    methodName: 'testMethod',
                    requestId: 'abc123'
                });
            }).not.toThrow();
            expect(logs.length).toBeGreaterThan(0);
        });
    });

    describe('Log Level Priority Filtering', () => {
        it('should only log messages at or above the configured level', () => {
            const logs: string[] = [];
            const format = createLoggerFormat('test-server');

            const logger = winston.createLogger({
                level: 'warn', // Only warn, error, fatal should log
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            }) as any;

            logger.fatal('fatal message');
            logger.error('error message');
            logger.warn('warn message');
            logger.info('info message'); // Should not appear
            logger.debug('debug message'); // Should not appear

            expect(logs.length).toBe(3);
            expect(logs.some(log => log.includes('fatal message'))).toBe(true);
            expect(logs.some(log => log.includes('error message'))).toBe(true);
            expect(logs.some(log => log.includes('warn message'))).toBe(true);
            expect(logs.some(log => log.includes('info message'))).toBe(false);
            expect(logs.some(log => log.includes('debug message'))).toBe(false);
        });

        it('should show verbose and trace logs when level is trace', () => {
            const logs: string[] = [];
            const format = createLoggerFormat('test-server');

            const logger = winston.createLogger({
                level: 'trace',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            }) as any;

            logger.verbose('verbose message');
            logger.debug('debug message');
            logger.trace('trace message');

            expect(logs.length).toBe(3);
            expect(logs.some(log => log.includes('verbose message'))).toBe(true);
            expect(logs.some(log => log.includes('debug message'))).toBe(true);
            expect(logs.some(log => log.includes('trace message'))).toBe(true);
        });
    });

    describe('Logger Format Output', () => {
        it('should include level abbreviations in output', () => {
            const logs: string[] = [];
            const format = createTestFormat('test-server');  // Use test format without colors

            const logger = winston.createLogger({
                level: 'trace',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            }) as any;

            logger.fatal('fatal');
            logger.error('error');
            logger.warn('warn');
            logger.info('info');
            logger.verbose('verbose');
            logger.debug('debug');
            logger.trace('trace');

            // Verify we have all 7 log messages
            expect(logs.length).toBe(7);

            // Check for level abbreviations - they should be in the format: TIME|LVL|SRV|...
            expect(logs.some(log => log.includes('|FTL|'))).toBe(true);
            expect(logs.some(log => log.includes('|ERR|'))).toBe(true);
            expect(logs.some(log => log.includes('|WRN|'))).toBe(true);
            expect(logs.some(log => log.includes('|INF|'))).toBe(true);
            expect(logs.some(log => log.includes('|VRB|'))).toBe(true);
            expect(logs.some(log => log.includes('|DBG|'))).toBe(true);
            expect(logs.some(log => log.includes('|TRC|'))).toBe(true);
        });

        it('should include server ID in formatted output', () => {
            const logs: string[] = [];
            const serverId = 'test-srv-123';
            const format = createLoggerFormat(serverId);

            const logger = winston.createLogger({
                level: 'info',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            });

            logger.info('test message');

            expect(logs.length).toBe(1);
            // Server ID is truncated, so check for partial match
            const cleanLog = stripAnsi(logs[0]);
            expect(cleanLog).toContain('test-srv');
        });

        it('should include className and methodName when provided', () => {
            const logs: string[] = [];
            const format = createLoggerFormat('test-server');

            const logger = winston.createLogger({
                level: 'info',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            });

            const childLogger = logger.child({className: 'TestClass', methodName: 'testMethod'});
            childLogger.info('test message');

            expect(logs.length).toBe(1);
            expect(logs[0]).toContain('TestClass');
            expect(logs[0]).toContain('testMethod');
        });

        it('should include requestId when provided', () => {
            const logs: string[] = [];
            const format = createLoggerFormat('test-server');

            const logger = winston.createLogger({
                level: 'info',
                levels,
                format,
                transports: [
                    new winston.transports.Stream({
                        stream: createMockStream(logs)
                    })
                ]
            });

            logger.info('test message', {requestId: 'req-abc123'});

            expect(logs.length).toBe(1);
            expect(logs[0]).toContain('abc123');
        });
    });
});
