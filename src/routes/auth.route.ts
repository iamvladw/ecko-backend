import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../helpers/config.helper';
import logger from '../helpers/winston.helper';
import User from '../interfaces/user.interface';
import { masterInstance, helperDatabase } from '../helpers/database.helper';
import { helperReplication } from '../helpers/replication.helper';
import helperEcko from '../helpers/ecko.helper';
import { v4 as uuid } from 'uuid';
import helperCache from '../helpers/cache.helper';
import helperAES from '../helpers/aes.helper';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.post(
    '/login',
    [
        body('username')
            .optional()
            .notEmpty()
            .withMessage('Username is required'),
        body('email')
            .optional()
            .isEmail()
            .notEmpty()
            .withMessage('Email is required'),
        body('password')
            .isLength({ min: 8 })
            .notEmpty()
            .withMessage('Password is required')
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { username, email, password } = req.body;

        // Gets the user from the database
        const user = await helperDatabase.fetchUser(masterInstance, {
            username: username as string,
            email: email as string
        });

        // Check if the user is valid
        if (!user) {
            logger.error('Invalid username or password');
            return res
                .status(401)
                .json({ error: 'Invalid username or password' });
        }

        if (helperAES.decrypt(user.password) !== password) {
            logger.error('Invalid password');
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Signs the token based on the username
        const token = jwt.sign(
            helperReplication.unpackUserFields(user),
            helperCache.instance.server.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        logger.info('Signing in the token...');

        // Set the token as an HTTP-only cookie in the response
        logger.info('Sending the token as a cookie...');
        res.cookie('authorization', token, { httpOnly: true });

        // Outputs the token as json format
        logger.log('success', `New token has been deployed ${token}`);
        res.json({ token });
    }
);

router.post('/logout', (req, res) => {
    const ip = req.headers['x-real-ip'] ?? req.socket.remoteAddress;

    try {
        // Clear the token stored in the cookies
        res.clearCookie('authorization');

        return res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        logger.error(
            `Error while trying to log out ${ip as string}: ${err as string}`
        );
        return res.status(500).json({ message: 'Failed to logout' });
    }
});

router.post(
    '/register',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().notEmpty().withMessage('Email is required'),
        body('password')
            .isLength({ min: 8 })
            .notEmpty()
            .withMessage('Password is required')
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if username and password are provided
        if (!username || !password) {
            logger.warn('Please provide a username and a password');
            return res
                .status(400)
                .json({ message: 'Please provide a username and a password' });
        }

        const { score } = helperEcko.checkPasswordStrength(password as string);

        if (score < 2) {
            logger.warn('Password is too weak');
            return res.status(400).json({ message: 'Password is too weak' });
        }

        // Gets the user from the database
        const user = await helperDatabase.fetchUser(masterInstance, {
            username: username,
            email: email
        });

        // Check if the user is valid
        if (user) {
            logger.warn(
                `User already exists based on the data provided ${JSON.stringify(
                    req.body
                )}`
            );
            return res
                .status(401)
                .json({message: 'User already exists based on the data provided'});
        }

        const currentDate = new Date();

        const userInstance: User = {
            uuid: uuid(),
            username: username,
            ekoTag: helperEcko.generateEkoTag(),
            email: email,
            password: helperAES.encrypt(password as string) as string,
            joinedDate: currentDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }),
            badges: [],
            followedInterests: [],
            followersCount: 0,
            followingCount: 0,
            followers: [],
            following: []
        };

        // Adding the user into the array
        await helperDatabase.addUser(masterInstance, userInstance);

        // Signs the token based on the username
        const token = jwt.sign(
            userInstance,
            helperCache.instance.server.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        logger.info('Signing in the token...');

        // Set the token as an HTTP-only cookie in the response
        logger.info('Sending the token as a cookie...');
        res.cookie('authorization', token, { httpOnly: true });

        // Outputs the token as json format
        logger.log('success', `New token has been deployed ${token}`);
        res.json({ token });
    }
);

export default router;
