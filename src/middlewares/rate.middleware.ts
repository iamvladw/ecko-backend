import { rateLimit } from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum requests per windowMs
    message: 'Too many requests, please try again later.', // Custom message for rate limit exceeded
    statusCode: 429, // HTTP status code for rate limit exceeded
    handler: (req, res) => {
        // Custom handler to send the rate limit exceeded response
        res.status(429).json({error: 'Too many requests, please try again later.'});
    }
});

export default limiter;
