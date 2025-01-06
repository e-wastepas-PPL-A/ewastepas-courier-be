import winston from 'winston';
import { LoggingWinston } from "@google-cloud/logging-winston";

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'blue',
    }
};

winston.addColors(customLevels.colors);

export const logger = winston.createLogger({
    levels: customLevels.levels,
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'logs/app.log' }),
        new LoggingWinston({
            projectId: 'dragon-breath-423920',
            keyFilename: 'dragon-breath-423920.json'
        })
    ]
});