import { NextFunction, Request, Response } from 'express';
import { serverEnabled } from '../server';

const serverStatus = (req: Request, res: Response, next: NextFunction) => {
    if (!serverEnabled) {
        return res
            .status(503)
            .json({ message: 'Server is not fully enabled yet' });
    } else {
        next();
    }
};

export default serverStatus;
