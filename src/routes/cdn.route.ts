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
import config from '../helpers/config.helper';

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

        const { uuid } = req.params;

        const uploadedFile = req.file;

        if (uploadedFile) {
            logger.log('success', `File ${uploadedFile.filename} uploaded and compressed successfully`);
            res.status(200).json({ file: uploadedFile.filename});
        } else {
            logger.error('No file uploaded');
            res.status(400).json({ message: 'No file uploaded' });
        }
    }
);

router.get('/:uuid/:file', 
    [
        param('uuid').notEmpty().withMessage('UUID is required'),
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
            const filePath = path.join(__dirname, '../../', config.cdn.path, uuid, helperEcko.fetchFileExtensionGroup(path.extname(file)), file);

            logger.info(`Fetching file: ${filePath}`);
            logger.log('success', `File ${file} fetched successfully`);
            res.sendFile(filePath);
        } catch(err) {
            logger.error(`Error while fetching file: ${err as string}`);
            res.status(500).json({ error: 'File not found' });
        }
    });

export default router;