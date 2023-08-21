// interest.route.ts
import express, { Request, Response } from 'express';
import logger from '../helpers/winston.helper';
import { helperDatabase, masterInstance } from '../helpers/database.helper';
import { v4 as uuid } from 'uuid';
import authKey from '../middlewares/api.middleware';
import { body, param, validationResult } from 'express-validator';
import { Interest, InterestGroup } from '../interfaces/interest.interface';

const router = express.Router();

router.post(
    '/add/group/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { name, description } = req.body;

        const interestGroup = await helperDatabase.fetchInterestGroup(
            masterInstance,
            { name: name }
        );

        if (interestGroup) {
            logger.warn(
                `Interest group already exists based on the data provided ${JSON.stringify(
                    req.body
                )}`
            );
            return res.status(401).json({
                message:
                    'Interest group already exists based on the data provided'
            });
        }

        const InterestGroupInstance: InterestGroup = {
            uuid: uuid(),
            name: name,
            description: description,
            interests: []
        };

        await helperDatabase
            .addInterestGroup(masterInstance, InterestGroupInstance)
            .then(() => {
                res.json({ InterestGroupInstance });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.put(
    '/edit/group/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interestGroup = await helperDatabase.fetchInterestGroup(
            masterInstance,
            { uuid: uuid }
        );

        if (!interestGroup) {
            logger.error('Interest group not found');
            return res.status(404).json({ error: 'Interest group not found' });
        }

        const updatedInterestGroup: InterestGroup = {
            ...interestGroup,
            ...req.body
        };

        await helperDatabase
            .editInterestGroup(masterInstance, uuid, updatedInterestGroup)
            .then(() => {
                res.json({ updatedInterestGroup });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.delete(
    '/remove/group/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interestGroup = await helperDatabase.fetchInterestGroup(
            masterInstance,
            { uuid: uuid }
        );

        if (!interestGroup) {
            logger.error('Invalid interest group');
            return res.status(401).json({ error: 'Invalid interest group' });
        }

        await helperDatabase
            .removeInterestGroup(masterInstance, uuid)
            .then(() => {
                res.json({message: `The interest group ${uuid} has been removed successfully`});
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.get(
    '/fetch/group/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interestGroup = await helperDatabase.fetchInterestGroup(
            masterInstance,
            { uuid: uuid }
        );

        if (!interestGroup) {
            logger.error('Interest group not found');
            return res.status(404).json({ error: 'Interest group not found' });
        }

        try {
            res.json({ interestGroup });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get('/fetch/groups', authKey, async (req: Request, res: Response) => {
    const interestGroups = await helperDatabase.fetchInterestGroups(
        masterInstance
    );

    if (!interestGroups) {
        logger.error('Interest groups not found');
        return res.status(404).json({ error: 'Interest groups not found' });
    }

    try {
        res.json({ interestGroups });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post(
    '/add/interest',
    [
        body('name').notEmpty().withMessage('name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('group').notEmpty().withMessage('Group is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { name, description, group } = req.body;

        if (!name || !description) {
            logger.warn('Please provide a name and a description');
            return res
                .status(400)
                .json({ message: 'Please provide a name and a description' });
        }

        const interest = await helperDatabase.fetchInterest(masterInstance, {name: name});

        if (interest) {
            logger.warn(
                `Interest already exists based on the data provided ${JSON.stringify(
                    req.body
                )}`
            );
            return res.status(401).json({message: 'Interest already exists based on the data provided'});
        }

        const interestGroup = await helperDatabase.fetchInterestGroup(
            masterInstance,
            { uuid: group }
        );

        if (!interestGroup) {
            logger.error('Interest group not found');
            return res.status(404).json({ error: 'Interest group not found' });
        }

        const InterestInstance: Interest = {
            uuid: uuid(),
            name: name,
            description: description,
            followers: [],
            group: group
        };

        await helperDatabase
            .addInterest(masterInstance, InterestInstance)
            .then(() => {
                res.json({ InterestInstance });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.put(
    '/edit/interest/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interest = await helperDatabase.fetchInterest(masterInstance, {uuid: uuid});

        if (!interest) {
            logger.error('Interest not found');
            return res.status(404).json({ error: 'Interest not found' });
        }

        const updatedInterest: Interest = { ...interest, ...req.body };

        await helperDatabase
            .editInterest(masterInstance, uuid, updatedInterest)
            .then(() => {
                res.json({ updatedInterest });
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.delete(
    '/remove/interest/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interest = await helperDatabase.fetchInterest(masterInstance, {uuid: uuid});

        if (!interest) {
            logger.error('Invalid interest');
            return res.status(401).json({ error: 'Invalid interest' });
        }

        await helperDatabase
            .removeInterest(masterInstance, uuid)
            .then(() => {
                res.json({message: `The interest ${uuid} has been removed successfully`});
            })
            .catch(() => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }
);

router.get(
    '/fetch/interest/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    async (req: Request, res: Response) => {
        const { uuid } = req.params;

        const interest = await helperDatabase.fetchInterest(masterInstance, {uuid: uuid});

        if (!interest) {
            logger.error('Interest not found');
            return res.status(404).json({ error: 'Interest not found' });
        }

        try {
            res.json({ interest });
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get('/fetch/interests', authKey, async (req: Request, res: Response) => {
    const interests = await helperDatabase.fetchInterests(masterInstance);

    if (interests.length < 0) {
        logger.error('Interests not found');
        return res.status(404).json({ error: 'Interests not found' });
    }

    try {
        res.json({ interests });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post(
    '/add/follower/',
    [
        body('interest').notEmpty().withMessage('Interest uuid is required'),
        body('follower').notEmpty().withMessage('Follower uuid is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { interest, follower } = req.body;

        await helperDatabase
            .fetchInterest(masterInstance, { uuid: interest })
            .then(async (interestInstance) => {
                if (!interestInstance) {
                    logger.error('Invalid interest');
                    return res.status(401).json({ error: 'Invalid interest' });
                }

                try {
                    await helperDatabase.addFollowerToInterest(
                        masterInstance,
                        String(interest),
                        follower as string
                    );

                    res.json({
                        message: `The follower ${
                            follower as string
                        } has been added from interest ${
                            interest as string
                        } successfully`
                    });
                } catch (err) {
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
    }
);

router.delete(
    '/remove/follower/',
    [
        body('interest').notEmpty().withMessage('Interest uuid is required'),
        body('follower').notEmpty().withMessage('Follower uuid is required')
    ],
    authKey,
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { interest, follower } = req.body;

        await helperDatabase
            .fetchInterest(masterInstance, { uuid: interest })
            .then(async (interestInstance) => {
                if (!interestInstance) {
                    logger.error('Invalid interest');
                    return res.status(401).json({ error: 'Invalid interest' });
                }

                try {
                    await helperDatabase.removeFollowerFromInterest(
                        masterInstance,
                        interest as string,
                        follower as string
                    );

                    res.json({
                        message: `The follower ${
                            follower as string
                        } has been removed from interest ${
                            interest as string
                        } successfully`
                    });
                } catch (err) {
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
    }
);

export default router;
