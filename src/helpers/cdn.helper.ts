import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import logger from './winston.helper';
import config from './config.helper';
import path from 'path';
import fs from 'fs';
import helperFunctions from './functions.helper';
import helperEcko from './ecko.helper';

const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        const filePath = config.cdn.path;
        const { uuid } = req.params;

        const subdirectories = ['audio', 'video', 'image', 'other'];

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
        if (!fs.existsSync(`${filePath}/${uuid}`)) {
            fs.mkdirSync(`${filePath}/${uuid}`, { recursive: true });
        }
        for (const subdirectory of subdirectories) {
            if (!fs.existsSync(`${filePath}/${uuid}/${subdirectory}`)) {
                fs.mkdirSync(`${filePath}/${uuid}/${subdirectory}`, { recursive: true });
            }
        }
        cb(null, `${filePath}/${uuid}`);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const { originalname } = file;
        const filename = `${Date.now()}-${originalname}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',  'image/tiff', 'image/tif', 'image/bmp', 
            'video/x-msvideo', 'video/mp4', 'video/quicktime', 'video/quicktime', 'video/mpeg', 'video/mpg', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/3gpp',
            'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/ogg', 'audio/x-ms-wma', 'audio/webm', 'audio/3gpp', 'audio/aac'
        ];
  
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
}).single('file');

export { storage, upload };
