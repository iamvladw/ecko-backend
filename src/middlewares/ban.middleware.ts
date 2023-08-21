import { Request, Response, NextFunction } from 'express';
import helperBan from '../helpers/ban.helper';
import logger from '../helpers/winston.helper';

const banChecker = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress;

    if (helperBan.isBanned(String(ip))) {
        logger.warn(
            `IP ${String(ip)} tried to access the server but it's banned`
        );
        return res
            .status(403)
            .json({ error: 'You are banned from this server' });
    } else {
        next();
    }
};

export default banChecker;
