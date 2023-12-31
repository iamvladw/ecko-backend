import { Request, Response, NextFunction, Send } from 'express';
import logger from '../helpers/winston.helper';
import { helperReplication } from '../helpers/replication.helper';
import helperCache from '../helpers/cache.helper';

const requestLoggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress;

    // Log the incoming request
    logger.log(
        'request',
        `Incoming request from ${String(ip)} using ${req.method} Method at ${
            req.url
        }`
    );
    logger.log('request', `Headers: ${JSON.stringify(req.headers)}`);

    helperCache.get.data.numberOfRequests++;
    helperCache.update();

    // Log the outgoing response
    const originalSend: Send = res.send;
    res.send = function (body: Send) {
        logger.log(
            'response',
            `Outgoing response to ${String(ip)} with code: ${res.statusCode}`
        );

        helperCache.get.data.numberOfResponses++;
        helperCache.update();

        try {
            switch (req.method) {
            case 'POST':
            case 'PUT':
            case 'PATCH':
            case 'DELETE':
                void helperReplication.performReplication();
                break;
            }
        } catch (err) {
            logger.log(
                'error',
                `Error while trying to sending a response to ${String(ip)}: ${
                    err as string
                }`
            );
        }

        return originalSend.call(this, body);
    };

    next();
};

export default requestLoggerMiddleware;
