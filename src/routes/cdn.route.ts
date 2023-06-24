import express, { Request, Response } from 'express';
import { upload } from '../helpers/cdn.helper';
import logger from '../helpers/winston.helper';
import authKey from '../middlewares/api.middleware';
import authenticate from '../middlewares/auth.middleware';
import helperEcko from '../helpers/ecko.helper';
import AuthenticatedRequest from '../interfaces/auth.interface';
import { param, validationResult } from 'express-validator';
import { helperDatabase, masterInstance } from '../helpers/database.helper';
import uploadWithCompression from '../middlewares/upload.middleware';
import path from 'path';

const router = express.Router();

router.post(
    '/upload/:uuid',
    [param('uuid').notEmpty().withMessage('UUID is required')],
    authKey,
    uploadWithCompression,
    (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const uploadedFile = req.file;

        if (uploadedFile) {
            const { originalname, filename, mimetype } = uploadedFile;

            logger.log('success', `File ${originalname} uploaded and compressed successfully`);
            res.json({ message: 'File uploaded successfully' });
        } else {
            logger.error('No file uploaded');
            res.status(400).json({ message: 'No file uploaded' });
        }
    }
);

router.get('/:uuid/:type/:file', 
    [
        param('uuid').notEmpty().withMessage('UUID is required'),
        param('type').notEmpty().withMessage('Type is required'),
        param('file').notEmpty().withMessage('File is required')
    ],
    async (req: Request, res: Response) => {
        const { uuid, type, file } = req.params;
  
        const user = await helperDatabase.fetchUser(masterInstance, { uuid: uuid });

        if (!user) {
            logger.error('Invalid user');
            return res.status(401).json({ error: 'Invalid user' });
        }

        try {
            const filePath = path.join(__dirname, '../../', 'uploads', uuid, type, file);

            logger.info(`Fetching file: ${filePath}`);
            logger.log('success', `File ${file} fetched successfully`);
            res.sendFile(filePath);
        } catch(err) {
            logger.error(`Error while fetching file: ${err as string}`);
            res.status(500).json({ error: 'File not found' });
        }
    });

export default router;
