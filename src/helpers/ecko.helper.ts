import http from 'http';
import https from 'https';
import fs from 'fs';
import config from './config.helper';
import logger from './winston.helper';
import SystemInformation from 'systeminformation';
import websocket from 'ws';
import helperGithub from './github.helper';
import packageJson from './package.helper';
import helperFunctions from './functions.helper';
import helperCache from './cache.helper';
import os from 'os';
import helperAES from './aes.helper';
import express, { Request } from 'express';
import { helperDatabase, masterInstance } from './database.helper';
import JwtPayload from '../interfaces/jwt.interface';
import jwt from 'jsonwebtoken';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import checkDatabaseConnection from '../middlewares/database.middleware';
import limiter from '../middlewares/rate.middleware';
import requestLoggerMiddleware from '../middlewares/request.middleware';
import cdnRouter from '../routes/cdn.route';
import path from 'path';

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

    public static initializeEckoServer(server?: express.Express) {
        if (!fs.existsSync(config.cdn.path)) {
            fs.mkdir(config.cdn.path, { recursive: true }, (err) => {
                if (err) {
                    logger.error(
                        `Error while trying to create the CDN folder: ${String(
                            err
                        )}`
                    );
                }
            });
        }

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
                logger.warn(
                    `Error while trying to load SSL Cert: ${err as string}`
                );
                logger.warn('Falling back to HTTP...');
                config.protocol = 'http';
                return http.createServer(server);
            }
        }
    }

    public static wss: websocket.Server;

    public static initializeEckoWebSocketServer() {
        if (process.env.JEST_WORKER_ID === undefined) {
            try {
                this.wss = new websocket.Server({ port: config.wss.port });

                this.wss.setMaxListeners(config.wss.maxListeners);

                logger.info(
                    `WSS is running on: ${config.protocol}://${config.dns}:${config.wss.port}`
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

    public static initializeEckoCDNServer() {
        try {
            const server = express();
            const cdnServer = this.initializeEckoServer(server);

            server.use(express.json());
            server.use(express.urlencoded({ extended: false }));
            server.use(helmet());
            server.use(compression({ brotli: { quality: 2 } }));
            server.use(cookieParser());
            server.use(limiter);
            server.use(checkDatabaseConnection);
            server.use(requestLoggerMiddleware);

            server.use('/attachments', cdnRouter);

            cdnServer.listen(config.cdn.port, config.dns, () => {
                logger.info(
                    `CDN is running on: ${config.protocol}://${config.dns}:${config.cdn.port}`
                );
            });
        } catch (err) {
            logger.error(
                `Error while trying to start the CDN server on ${
                    config.protocol
                }://${config.dns}:${config.cdn.port}: ${err as string}`
            );
            process.exit(1);
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

        return { level, strength, score };
    }

    public static async fetchLocalUser(req: Request) {
        try {
            const token: string = req.cookies.authorization as string;

            if (!token) {
                logger.warn('Missing token');
            }

            const decoded = jwt.verify(
                token,
                helperCache.instance.server.secret
            ) as JwtPayload;

            const userData = decoded;

            const user = await helperDatabase.fetchUser(masterInstance, {
                username: userData.username,
                email: userData.email
            });

            // Check if the user is valid
            if (!user) {
                logger.warn('Invalid username or password');
            }

            return userData;
        } catch (err) {
            logger.error(
                `Error while trying to fetch the local user: ${err as string}`
            );
        }
    }

    public static fetchFileExtensionGroup(filename: string) {
        switch (filename.toLowerCase()) {
        case '.jpeg':
        case '.jpg':
        case '.png':
        case '.webp':
        case '.tiff':
        case '.tif':
        case '.bmp':
            return 'image';
        case '.avi':
        case '.mp4':
        case '.mov':
        case '.mkv':
        case '.mpeg':
        case '.mpg':
        case '.wmv':
        case '.flv':
        case '.webm':
        case '.3gp':
            return 'video';
        case '.mp3':
        case '.aac':
        case '.wav':
        case '.flac':
        case '.ogg':
        case '.wma':
            return 'audio';
        default:
            return 'other';
        }
    }
}
