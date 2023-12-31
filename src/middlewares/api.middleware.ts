import { Response, NextFunction } from 'express';
import logger from '../helpers/winston.helper';
import AuthenticatedRequest from '../interfaces/auth.interface';
import helperCache from '../helpers/cache.helper';
import helperAES from '../helpers/aes.helper';
import config from '../helpers/config.helper';

// Middleware function to check for a valid JWT in the Authorization cookie
const authKey = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Check if the request is from the local machine
        const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress;

        // Skip API key check for local requests
        if (ip?.includes('127.0.0.1')) {
            next();
            return logger.info('Local request, skipping API key check...');
        }

        // Override the apiAuthMethod if the whitelist is empty
        if (config.whitelist.length === 0) {
            config.apiAuthMethod = 'key';
        }

        // Checks the api auth method
        if (config.apiAuthMethod === 'key') {
            // Get the API key from the Authorization header
            const apiKey: string = req.header('x-api-key') as string;

            // Check if the API key is missing
            if (!apiKey) {
                logger.warn('Missing API key');
                return res.status(401).json({ error: 'Missing API key' });
            }

            // Verify if the API key is valid
            if (apiKey !== helperCache.get.server.apiKey) {
                logger.warn('Invalid API key');
                return res.status(401).json({ error: 'Invalid API key' });
            }

            // Verify the decrypted value of the API key
            const decryptedApiKey = helperAES.decrypt(apiKey);
            if (decryptedApiKey !== helperCache.get.server.secretPhrase) {
                logger.warn('Invalid API key secret phrase');
                return res
                    .status(401)
                    .json({ error: 'Invalid API key secret phrase' });
            }

            next();
        } else if (config.apiAuthMethod === 'ip') {
            const ip_pool = config.whitelist;
            const matchedIP = ip_pool.find((poolIP) => {
                if (config.cloudflareProxy) {
                    return ip?.includes(poolIP);
                } else {
                    return ip?.includes(`::ffff:${poolIP}`);
                }
            });

            if (matchedIP) {
                next();
                return logger.info(
                    'Accessing with an whitelisted IP, access granted...'
                );
            } else {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        } else if (config.apiAuthMethod === 'both') {
            const ip_pool = config.whitelist;
            const matchedIP = ip_pool.find((poolIP) => {
                if (config.cloudflareProxy) {
                    return ip?.includes(poolIP);
                } else {
                    return ip?.includes(`::ffff:${poolIP}`);
                }
            });

            if (matchedIP) {
                next();
                return logger.info(
                    'Accessing with an whitelisted IP, access granted...'
                );
            }

            // Get the API key from the Authorization header
            const apiKey: string = req.header('x-api-key') as string;

            // Check if the API key is missing
            if (!apiKey) {
                logger.warn('Missing API key');
                return res.status(401).json({ error: 'Missing API key' });
            }

            // Verify if the API key is valid
            if (apiKey !== helperCache.get.server.apiKey) {
                logger.warn('Invalid API key');
                return res.status(401).json({ error: 'Invalid API key' });
            }

            // Verify the decrypted value of the API key
            const decryptedApiKey = helperAES.decrypt(apiKey);
            if (decryptedApiKey !== helperCache.get.server.secretPhrase) {
                logger.warn('Invalid API key secret phrase');
                return res
                    .status(401)
                    .json({ error: 'Invalid API key secret phrase' });
            }

            next();
        }
    } catch (err) {
        // Handle unexpected errors
        logger.error(`Error while verifying API key: ${err as string}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default authKey;
