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
export const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
export const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

function formatTime(ts: any): string {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
}

function initialism(name: string): string {
    const caps = name.match(/[A-Z]/g);
    if (caps && caps.length >= 2) return caps.join("");
    return name.slice(0, 2);
}

function truncate(s: string, width: number): string {
    if (s.length <= width) return s.padEnd(width, " ");
    return s.slice(0, Math.max(0, width - 1)) + "…";
}

function shortRid(rid?: string, n = 6) {
    if (!rid) return "";
    const s = String(rid);
    return `rid=${s.length <= n ? s : s.slice(-n)}`;
}

function formatLocation(cls?: string, mth?: string, width = 26): string {
    const c = cls ? String(cls) : "";
    const m = mth ? String(mth) : "";
    if (!c && !m) return "";

    const full = c && m ? `${c}.${m}` : (c || m);
    if (full.length <= width) return full;

    if (c && m) {
        const init = `${initialism(c)}.${m}`;
        if (init.length <= width) return init;

        // truncate class to fit
        const roomForClass = Math.max(1, width - (m.length + 1));
        const truncCls = truncate(c, roomForClass).trim();
        return `${truncCls}.${m}`.slice(0, width);
    }

    return full.slice(0, width);
}

export function createLoggerFormat(serverId: string) {
    const W_LVL = 3;
    const W_SRV = 10;
    const W_LOC = 28;
    const W_RID = 12;

    const lvl3 = (lvl: string) => {
        const l = lvl.toLowerCase();
        if (l === "error") return "ERR";
        if (l === "warn") return "WRN";
        if (l === "info") return "INF";
        if (l === "debug") return "DBG";
        if (l === "http") return "HTP";
        return l.slice(0, 3).toUpperCase();
    };

    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({all: true}),
        winston.format.printf(({ level, message, timestamp, className, methodName, requestId, ...metadata }) => {
            const time = formatTime(timestamp);
            const lvl = truncate(lvl3(level), W_LVL).trim();
            const srv = truncate(serverId, W_SRV).trim();
            const loc = truncate(formatLocation(className, methodName, W_LOC), W_LOC).trimEnd();
            const rid = truncate(shortRid(requestId, 6), W_RID).trim();

            let msg = `${time}|${lvl}|${srv}|${loc}|${rid}|${message}`;
            if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
            }
            return msg;
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

export const LoggerFactoryToken: InjectionToken<(cls: Function | string) => winston.Logger> = 'LoggerFactory';

container.register(LoggerFactoryToken, {
    useFactory: () => (cls: Function | string) => logger.child({className: (cls as Function).name ?? cls})
});

export default logger;
