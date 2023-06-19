import http from 'http';
import https from 'https';
import fs from 'fs';
import config from './config.helper';
import { server } from '../server';
import logger from './winston.helper';
import SystemInformation from 'systeminformation';
import websocket from 'ws';
import { wssData } from './wss.helper';
import helperGithub from './github.helper';
import { EventEmitter } from 'stream';

export default class helperEcko {
    public static generateEkoTag(): string {
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

    public static initializeEckoWebSocketServer() {
        if (process.env.JEST_WORKER_ID === undefined) {
            try {
                const wss = new websocket.Server({ port: config.wss.port });
    
                wss.setMaxListeners(15);
    
                logger.info(
                    `WebSocket server is running on: ${config.protocol}://${config.dns}:${config.wss.port}`
                );
    
                wss.on('connection', (ws) => {
                    const dataInterval = setInterval(async () => {
                        wssData.public.githubVersion =
                            await helperGithub.getGitHubPackageVersion();
                        wssData.public.cpuUsage = await helperEcko.serverCPUUsage();
    
                        ws.send(JSON.stringify(wssData));
                    }, config.wss.interval);
    
                    wss.on('close', () => {
                        clearInterval(dataInterval);
                    });
                });
            } catch (err) {
                logger.error(
                    `Error initializing the WebSocket server on port ${
                        config.wss.port
                    }: ${err as string}`
                );
                logger.error('Shutting down the server...');
                process.exit(1);
            }
        }
    }

    public static async serverCPUUsage() {
        const cpuData = await SystemInformation.currentLoad();
        const cpuUsagePercentage = cpuData.currentLoad;

        return cpuUsagePercentage.toFixed(2);
    }
}
