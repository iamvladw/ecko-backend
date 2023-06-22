import http from 'http';
import https from 'https';
import fs from 'fs';
import config from './config.helper';
import { server } from '../server';
import logger from './winston.helper';
import SystemInformation from 'systeminformation';
import websocket from 'ws';
import helperGithub from './github.helper';
import packageJson from './package.helper';
import helperFunctions from './functions.helper';
import helperCache from './cache.helper';
import os from 'os';
import helperAES from './aes.helper';

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

    public static wss: websocket.Server;

    public static initializeEckoWebSocketServer() {
        if (process.env.JEST_WORKER_ID === undefined) {
            try {
                const server = http.createServer();
                this.wss = new websocket.Server({ port: config.wss.port });

                this.wss.setMaxListeners(config.wss.maxListeners);

                logger.info(
                    `WebSocket server is running on: ${config.protocol}://${config.dns}:${config.wss.port}`
                );

                this.wss.on('connection', (ws) => {
                    ws.on('message', (message) => {
                        const parsedMessage = JSON.parse(String(message));
                        const { route, key } = parsedMessage;

                        if (route === 'staticPage') {
                            const publicDataInterval = setInterval(async () => {
                                const wssData = {
                                    currentBranch: helperGithub.getBranch(),
                                    currentCommit: helperGithub.getCommit(),
                                    currentVersion: packageJson.version,
                                    githubVersion:
                                        await helperGithub.getGitHubPackageVersion(),
                                    memUsage: helperFunctions.formatBytes(
                                        os.totalmem() - os.freemem()
                                    ),
                                    cpuUsage: await helperEcko.serverCPUUsage(),
                                    requests: helperFunctions.formatNumber(
                                        helperCache.instance.data
                                            .numberOfRequests
                                    ),
                                    responses: helperFunctions.formatNumber(
                                        helperCache.instance.data
                                            .numberOfResponses
                                    )
                                };

                                ws.send(JSON.stringify(wssData));
                            }, config.wss.interval);

                            ws.on('close', () => {
                                clearInterval(publicDataInterval);
                            });
                        } else if (route === 'private') {
                            if (
                                helperAES.decrypt(String(key)) ===
                                helperCache.instance.server.secret
                            ) {
                                const dataInterval = setInterval(() => {
                                    // Update and send private data
                                    ws.send(JSON.stringify({ p: 'private' }));
                                }, config.wss.interval);

                                ws.on('close', () => {
                                    clearInterval(dataInterval);
                                });
                            } else {
                                ws.terminate();
                            }
                        } else {
                            ws.terminate();
                        }
                    });
                });
            } catch (err) {
                logger.error(
                    `Error while trying to start the websocket server on ${
                        config.protocol
                    }://${config.dns}:${config.wss.port}: ${err as string}`
                );
                process.exit(1);
            }
        }
    }

    public static async serverCPUUsage() {
        const cpuData = await SystemInformation.currentLoad();
        const cpuUsagePercentage = cpuData.currentLoad;

        return cpuUsagePercentage.toFixed(2);
    }

    public static checkPasswordStrength(password: string) {
        const criteria = {
            minLength: 8,
            hasUppercase: /[A-Z]/,
            hasLowercase: /[a-z]/,
            hasNumber: /[0-9]/,
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
        };

        const strength = {
            length: password.length >= criteria.minLength,
            uppercase: criteria.hasUppercase.test(password),
            lowercase: criteria.hasLowercase.test(password),
            number: criteria.hasNumber.test(password),
            specialChar: criteria.hasSpecialChar.test(password)
        };

        const score = Object.values(strength).filter((valid) => {
            return valid;
        }).length;

        let level;
        if (score === 5) {
            level = 'Excellent';
        } else if (score === 4) {
            level = 'Strong';
        } else if (score === 3) {
            level = 'Moderate';
        } else if (score === 2) {
            level = 'Fair';
        } else {
            level = 'Weak';
        }

        return {
            level,
            strength,
            score
        };
    }
}
