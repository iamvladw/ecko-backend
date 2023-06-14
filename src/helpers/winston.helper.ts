import winston, { createLogger } from 'winston';
import { format as winstonFormat } from 'logform';
import config from './config.helper';

// Define custom Logging Levels
const customLogging = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        request: 2,
        success: 2,
        debug: 2,
        setup: 2
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        request: 'magenta',
        success: 'green',
        debug: 'yellow',
        setup: 'magenta'
    }
};

// Define the log format for the JSON log file
const jsonFormat = winstonFormat.combine(
    winstonFormat.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winstonFormat.json()
);

// Define the log format for the console
const consoleFormat = winstonFormat.combine(
    winstonFormat.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winstonFormat.colorize(),
    winstonFormat.printf(({ level, message, timestamp }) => {
        switch (level) {
        default:
            return `[${String(timestamp)}] [${level}] ${String(message)}`;
        }
    })
);

const transport = [];

// Conditionally include the file transport if the flag is true
if (config.logs) {
    transport.push(
        new winston.transports.File({
            filename: 'latest.log',
            handleExceptions: true
        }),
        new winston.transports.Console({ format: consoleFormat })
    );
} else {
    transport.push(new winston.transports.Console({ format: consoleFormat }));
}

// Create the logger instance
const logger = createLogger({
    levels: customLogging.levels,
    level: 'info',
    format: jsonFormat,
    transports: transport
});

winston.addColors(customLogging.colors);

export default logger;
