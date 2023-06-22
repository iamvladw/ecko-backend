import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { helperDatabase, masterInstance } from '../helpers/database.helper';
import logger from '../helpers/winston.helper';
import authKey from '../middlewares/api.middleware';
import { Badge } from '../interfaces/badge.interface';
import { v4 as uuid } from 'uuid';

const router = express.Router();

router.post(
    '/add/badge',
    [
        body('icon').notEmpty().withMessage('Icon is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { icon, name, description } = req.body;

        if (!icon || !name || !description) {
            logger.warn('Please provide a icon, a name and a description');
            return res
                .status(400)
                .json({
                    message: 'Please provide a icon, a name and a description'
                });
        }

        const badge = await helperDatabase.fetchBadge(masterInstance, {
            name: name
        });

        if (badge) {
            logger.warn(
                `Badge already exists based on the data provided ${JSON.stringify(
                    req.body
                )}`
            );
            return res.status(401).json({
                message: 'Badge already exists based on the data provided'
            });
        }

        const badgeInstance: Badge = {
            uuid: uuid(),
            icon: icon,
            name: name,
            description: description
        };

        await helperDatabase
            .addBadge(masterInstance, badgeInstance)
            .then(() => {
                logger.log(
                    'success',
                    `Badge ${badgeInstance.uuid as string} added`
                );
                res.json({
                    badgeInstance
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.put(
    '/edit/badge/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const badge = await helperDatabase.fetchBadge(masterInstance, {
            uuid: uuid
        });

        if (!badge) {
            logger.error('Invalid badge');
            return res.status(404).json({ message: 'Invalid badge' });
        }

        const updatedBadge: Badge = {
            ...badge,
            ...req.body
        };

        await helperDatabase
            .editBadge(masterInstance, uuid, updatedBadge)
            .then(() => {
                res.json({
                    updatedBadge
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.delete(
    '/remove/badge/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const badge = await helperDatabase.fetchBadge(masterInstance, {
            uuid: uuid
        });

        if (!badge) {
            logger.error('Invalid badge');
            return res.status(404).json({ message: 'Invalid badge' });
        }

        await helperDatabase
            .removeBadge(masterInstance, uuid)
            .then(() => {
                logger.log('success', `Badge ${uuid} removed`);
                res.json({
                    message: `Badge ${uuid} removed`
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.get(
    '/fetch/badge/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const badge = await helperDatabase.fetchBadge(masterInstance, {
            uuid: uuid
        });

        if (!badge) {
            logger.error('Invalid badge');
            return res.status(404).json({ message: 'Invalid badge' });
        }

        res.json({
            badge
        });
    }
);

router.get('/fetch/badges', authKey, async (req: Request, res: Response) => {
    const badges = await helperDatabase.fetchBadges(masterInstance);

    if (!badges) {
        logger.error('Invalid badges');
        return res.status(404).json({ message: 'Invalid badges' });
    }

    res.json({
        badges
    });
});

router.post(
    '/add/user',
    [
        body('user').notEmpty().withMessage('User is required'),
        body('badge').notEmpty().withMessage('Badge is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const { user, badge } = req.body;

        const badgeInstance = await helperDatabase.fetchBadge(masterInstance, {
            uuid: badge
        });

        if (!badgeInstance) {
            logger.error('Invalid badge');
            return res.status(404).json({ message: 'Invalid badge' });
        }

        const userInstance = await helperDatabase.fetchUser(masterInstance, {
            uuid: user
        });

        if (!userInstance) {
            logger.error('Invalid user');
            return res.status(404).json({ message: 'Invalid user' });
        }

        await helperDatabase
            .addBadgeToUser(masterInstance, user as string, badge as string)
            .then(() => {
                logger.log(
                    'success',
                    `Badge ${badge as string} added to user ${user as string}`
                );
                res.json({
                    message: `Badge ${badge as string} added to user ${
                        user as string
                    }`
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.delete(
    '/remove/user',
    [
        body('user').notEmpty().withMessage('User is required'),
        body('badge').notEmpty().withMessage('Badge is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const { user, badge } = req.body;

        const badgeInstance = await helperDatabase.fetchBadge(masterInstance, {
            uuid: badge
        });

        if (!badgeInstance) {
            logger.error('Invalid badge');
            return res.status(404).json({ message: 'Invalid badge' });
        }

        const userInstance = await helperDatabase.fetchUser(masterInstance, {
            uuid: user
        });

        if (!userInstance) {
            logger.error('Invalid user');
            return res.status(404).json({ message: 'Invalid user' });
        }

        await helperDatabase
            .removeBadgeFromUser(
                masterInstance,
                user as string,
                badge as string
            )
            .then(() => {
                logger.log(
                    'success',
                    `Badge ${badge as string} removed from user ${
                        user as string
                    }`
                );
                res.json({
                    message: `Badge ${badge as string} removed from user ${
                        user as string
                    }`
                });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

export default router;
