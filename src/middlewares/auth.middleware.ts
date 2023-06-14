import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import JwtPayload from '../interfaces/jwt.interface';
import config from '../helpers/config.helper';
import logger from '../helpers/winston.helper';
import AuthenticatedRequest from '../interfaces/auth.interface';
import { helperReplication } from '../helpers/replication.helper';
import { helperDatabase, masterInstance } from '../helpers/database.helper';
import helperCache from '../helpers/cache.helper';

// Middleware function to check for a valid JWT in the Authorization cookie
async function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    // Get the JWT token from the Authorization cookie
    const token: string = req.cookies.authorization as string;

    // If there is no token, return an error
    if (!token) {
        logger.warn('Missing token');
        return res.status(401).json({ error: 'Missing token' });
    }

    try {
        // Verify the token and decode the payload
        const decoded = jwt.verify(
            token,
            helperCache.instance.server.secret
        ) as JwtPayload;

        // Attach the decoded user object to the request for future use
        req.user = decoded;

        // Gets the user from the database
        const user = await helperDatabase.fetchUser(masterInstance, {
            username: req.user.username,
            email: req.user.email
        });

        // Check if the user is valid
        if (!user) {
            logger.warn('Invalid username or password');
            return res
                .status(401)
                .json({ message: 'Invalid username or password' });
        }

        // Renews the token when the user is active on the platform
        const renewedToken = jwt.sign(
            helperReplication.unpackUserFields(user),
            helperCache.instance.server.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Set the token as an HTTP-only cookie in the response
        res.cookie('authorization', renewedToken, { httpOnly: true });

        // Call the next middleware function
        next();
    } catch (err) {
        logger.warn('Invalid token');
        logger.warn(`Headers: ${JSON.stringify(req.headers)}`);
        logger.error(`${String(err)}`);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export default authenticate;
