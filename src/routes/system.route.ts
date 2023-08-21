import express, { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import logger from '../helpers/winston.helper';
import helperCache from '../helpers/cache.helper';
import helperFunctions from '../helpers/functions.helper';
import config from '../helpers/config.helper';
import helperBan from '../helpers/ban.helper';

const router = express.Router();

let securityCode: string;
let serverRetries: Record<string, number>;

router.post(
    '/loadbalancer/setup/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        try {
            const { uuid } = req.params;
            const { mode, role } = helperCache.get.server;

            if (mode !== 'Load Balancer') {
                logger.error(
                    `UUID: ${uuid}, IP: ${req.ip} tried to setup this server as origin`
                );
                return res
                    .status(400)
                    .json({error: 'This server has not the load balancer option enabled'});
            }

            if (role !== 'Origin') {
                logger.error(
                    `UUID: ${uuid}, IP: ${req.ip} tried to setup this server as origin`
                );
                return res
                    .status(400)
                    .json({ error: 'This server is not an origin server' });
            }

            serverRetries[uuid] = 0;

            securityCode = String(Math.floor(Math.random() * 1000000));

            logger.log(
                'success',
                `Security code for ${uuid} has been deployed: ${securityCode}`
            );
            res.status(200).json({
                message:
                    'Security code has been deployed in the origins server console'
            });
        } catch (err) {
            logger.error(
                `Error while trying to setup the load balancer: ${
                    err as string
                }`
            );
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.post(
    '/loadbalancer/verify/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        try {
            const { uuid } = req.params;
            const { mode, role } = helperCache.get.server;

            if (mode !== 'Load Balancer') {
                logger.error(
                    `UUID: ${uuid}, IP: ${req.ip} tried to setup this server as origin`
                );
                return res
                    .status(400)
                    .json({error: 'This server has not the load balancer option enabled'});
            }

            if (role !== 'Origin') {
                logger.error(
                    `UUID: ${uuid}, IP: ${req.ip} tried to setup this server as origin`
                );
                return res
                    .status(400)
                    .json({ error: 'This server is not an origin server' });
            }

            const { securityCode: securityCodeFromClient } = req.body;

            if (securityCodeFromClient !== securityCode) {
                logger.error(`The security code has been changed for ${uuid}`);

                securityCode = String(Math.floor(Math.random() * 1000000));

                logger.log(
                    'success',
                    `New security code has been deployed: ${securityCode}`
                );

                serverRetries[uuid]++;

                if (serverRetries[uuid] > config.loadbalancer.maxRetries) {
                    delete serverRetries[uuid];

                    logger.warn(
                        `The server ${uuid} with the ip address ${req.ip} has exceeded the maximum number of retries`
                    );

                    await helperBan.banIP(req.ip);
                }

                return res.status(400).json({ error: 'Invalid security code' });
            }

            delete serverRetries[uuid];

            securityCode = '';

            helperCache.get.server.origin = req.ip;
            helperCache.update();

            logger.log('success', `${uuid} has been verified`);
            res.status(200).json({ cache: helperCache.get, config: config });
        } catch (err) {
            logger.error(
                `Error while trying to verify the origin server: ${
                    err as string
                }`
            );
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
