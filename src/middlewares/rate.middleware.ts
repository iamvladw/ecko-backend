import { rateLimit } from 'express-rate-limit';
import config from '../helpers/config.helper';

const limiter = rateLimit({
    windowMs: config.rateLimit.timeout * 60 * 1000,
    max: config.rateLimit.max,
    message: 'Too many requests, please try again later.',
    statusCode: 429, 
    handler: (req, res) => {
        res.status(429).json({error: 'Too many requests, please try again later.'});
    }
});

export default limiter;
