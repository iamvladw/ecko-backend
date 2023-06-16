import http from 'http';
import https from 'https';
import fs from 'fs';
import config from './config.helper';
import { server } from '../server';
import logger from './winston.helper';

export default class helperEcko {
    public static generateEkoTag(): string {
        // Generate a random number between 1000 and 9999
        const randomNumber = Math.floor(Math.random() * 9000) + 1000;

        const ekoTag = `EK${randomNumber}`;

        return ekoTag;
    }

    public static validateApiAuthMethod() {
        if (config.apiAuthMethod) {
            logger.info(`API auth method loaded as ${config.apiAuthMethod}`);
        }
    }

    public static initializeEckoServer() {
        if (config.protocol === 'http') {
            return http.createServer(server);
        } else {
            try {
                const options = {
                    key: fs.readFileSync(config.ssl.key),
                    cert: fs.readFileSync(config.ssl.cert)
                };
                return https.createServer(options, server);
            } catch (err) {
                config.protocol = 'http';
                return http.createServer(server);
            }
        }
    }
}
