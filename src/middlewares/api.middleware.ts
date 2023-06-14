import { Response, NextFunction } from 'express';
import logger from '../helpers/winston.helper';
import AuthenticatedRequest from '../interfaces/auth.interface';
import helperCache from '../helpers/cache.helper';
import helperAES from '../helpers/aes.helper';

// Middleware function to check for a valid JWT in the Authorization cookie
const authKey = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get the API key from the Authorization header
        const apiKey: string = req.header('x-api-key') as string;

        // Check if the API key is missing
        if (!apiKey) {
            logger.warn('Missing API key');
            return res.status(401).json({ error: 'Missing API key' });
        }

        // Verify if the API key is valid
        if (apiKey !== helperCache.instance.server.apiKey) {
            logger.warn('Invalid API key');
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Verify the decrypted value of the API key
        const decryptedApiKey = helperAES.decrypt(apiKey);
        if (decryptedApiKey !== helperCache.instance.server.secretPhrase) {
            logger.warn('Invalid API key secret phrase');
            return res
                .status(401)
                .json({ error: 'Invalid API key secret phrase' });
        }

        next();
    } catch (err) {
        // Handle unexpected errors
        logger.error(`Error during API key verification: ${err as string}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default authKey;
