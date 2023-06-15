// users.route.ts
import express, { Request, Response } from 'express';
import logger from '../helpers/winston.helper';
import { helperDatabase, masterInstance } from '../helpers/database.helper';
import helperAES from '../helpers/aes.helper';
import helperEcko from '../helpers/ecko.helper';
import User from '../interfaces/user.interface';
import { v4 as uuid } from 'uuid';
import authKey from '../middlewares/api.middleware';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

router.post(
    '/add/user',
    [
        body('username').notEmpty().trim().withMessage('Username is required'),
        body('email').notEmpty().trim().withMessage('Email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    authKey,
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
            return res.status(401).json({
                message: 'User already exists based on the data provided'
            });
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
            followedInterests: [],
            followers: [],
            following: []
        };

        // Adding the user into the array
        await helperDatabase
            .addUser(masterInstance, userInstance)
            .then(() => {
                res.json({
                    userInstance
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.put('/edit/user/:uuid', authKey, async (req: Request, res: Response) => {
    const { uuid } = req.params;

    // Find the user in the data store based on the UUID
    const user = await helperDatabase.fetchUser(masterInstance, {
        uuid: uuid
    });

    // Return an error if the user is not found
    if (!user) {
        logger.error('Invalid user');
        return res.status(401).json({ error: 'Invalid user' });
    }

    // Update the user object with the data from req.body
    const updatedUser: User = {
        ...user,
        ...req.body
    };

    await helperDatabase
        .editUser(masterInstance, uuid, updatedUser)
        .then(() => {
            res.json({
                updatedUser
            });
        })
        .catch(() => {
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

router.delete(
    '/remove/user/:uuid',
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        // Gets the user from the database
        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: uuid
        });

        // Check if the user is valid
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        await helperDatabase
            .removeUser(masterInstance, uuid)
            .then(() => {
                res.json({
                    message: `The user ${uuid} has been removed successfully`
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.get(
    '/fetch/user/:uuid',
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        // Find the user in the data store based on the UUID
        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: uuid
        });

        // Return an error if the user is not found
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        try {
            res.json({ user });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get('/fetch/users', authKey, async (req: Request, res: Response) => {
    // Find the user in the data store based on the UUID
    const users = await helperDatabase.fetchUsers(masterInstance);

    // Return an error if the user is not found
    if (!users) {
        logger.error('Users not found');
        return res.status(401).json({ error: 'Users not found' });
    }

    try {
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post(
    '/add/follower',
    [
        body('userUUID').notEmpty().withMessage('User uuid is required'),
        body('targetUUID').notEmpty().withMessage('Target uuid is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { userUUID, targetUUID } = req.body;

        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: userUUID
        });

        const target = await helperDatabase.fetchUser(masterInstance, {
            uuid: targetUUID
        });

        // Return an error if the user is not found
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        if (!target) {
            logger.error('Invalid target');
            return res.status(401).json({ error: 'Invalid target' });
        }

        try {
            await helperDatabase.addFollowerToUser(
                masterInstance,
                userUUID as string,
                targetUUID as string
            );

            res.json({
                message: `The follower ${
                    targetUUID as string
                } has been added to User ${userUUID as string} successfully`
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.delete(
    '/remove/follower',
    [
        body('userUUID').notEmpty().withMessage('User uuid is required'),
        body('targetUUID').notEmpty().withMessage('Target uuid is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { userUUID, targetUUID } = req.body;

        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: userUUID
        });

        const target = await helperDatabase.fetchUser(masterInstance, {
            uuid: targetUUID
        });

        // Return an error if the user is not found
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        if (!target) {
            logger.error('Invalid target');
            return res.status(401).json({ error: 'Invalid target' });
        }

        try {
            await helperDatabase.removeFollowerFromUser(
                masterInstance,
                userUUID as string,
                targetUUID as string
            );

            res.json({
                message: `The follower ${
                    targetUUID as string
                } has been added to User ${userUUID as string} successfully`
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get(
    '/fetch/followers/:uuid',
    [param('uuid').notEmpty().withMessage('User uuid is required')],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { uuid } = req.params;

        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: uuid
        });

        // Return an error if the user is not found
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        try {
            res.json({
                followerList: user.followers,
                followerCount: user.followersCount
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get(
    '/fetch/following/:uuid',
    [param('uuid').notEmpty().withMessage('User uuid is required')],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { uuid } = req.params;

        const user = await helperDatabase.fetchUser(masterInstance, {
            uuid: uuid
        });

        // Return an error if the user is not found
        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        try {
            res.json({
                followingList: user.following,
                followerCount: user.followingCount
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

export default router;
