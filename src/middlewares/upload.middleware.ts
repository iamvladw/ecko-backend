import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import sharp from 'sharp';
import { upload } from '../helpers/cdn.helper';
import logger from '../helpers/winston.helper';
import path from 'path';
import { exec } from 'child_process';
import helperEcko from '../helpers/ecko.helper';

const uploadWithCompression = (req: Request, res: Response, next: NextFunction) => {
    try {
        upload(req, res, async (err: string) => {
            if (err) {
                logger.error('Error while uploading file:', err);
                return res.status(500).json({ error: 'Upload failed' });
            }

            if (req.file) {
                let filePath = req.file.path;
                const fileExtension = path.extname(req.file.originalname);
                const compressedPath = `${req.file.destination}/${helperEcko.fetchFileExtensionGroup(fileExtension)}/${path.parse(req.file.filename).name}`;
                const tempPath = `${req.file.destination}/compressing-${path.parse(req.file.filename).name}`;

                switch (fileExtension.toLowerCase()) {
                case '.jpeg':
                case '.jpg':
                case '.png':
                case '.webp':
                case '.tiff':
                case '.tif':
                case '.bmp':
                    logger.info(`Compressing image: ${req.file.filename}`);
                    await sharp(filePath)
                        .toFormat('png')
                        .png({ quality: 80 })
                        .toFile(tempPath);

                    fs.unlinkSync(filePath);
          
                    fs.renameSync(tempPath, compressedPath);

                    filePath = compressedPath;

                    next();
                    break;
                case '.avi':
                case '.mp4':
                case '.mov':
                case '.mkv':
                case '.mpeg':
                case '.mpg':
                case '.wmv':
                case '.flv':
                case '.webm':
                case '.3gp':
                    logger.info(`Compressing video: ${req.file.filename}`);
                    const commandVideo = `ffmpeg -i "${filePath}" -vcodec libx264 -crf 25 -preset veryslow "${tempPath}.mp4"`;
                    exec(commandVideo, (err) => {
                        if (err) {
                            logger.error(`Error occurred while compressing video format: ${String(err)}`);
                            return res.status(500).json({ error: 'Something went wrong' });
                        }
                        fs.unlinkSync(filePath);
          
                        fs.renameSync(`${tempPath}.mp4`, `${compressedPath}.mp4`);

                        filePath = compressedPath;

                        next();
                    });
                    return;
                case '.mp3':
                case '.aac':
                case '.wav':
                case '.flac':
                case '.ogg':
                case '.wma':
                    logger.info(`Compressing audio: ${req.file.filename}`);
                    const commandAudio = `ffmpeg -i "${filePath}" -codec:a libmp3lame -b:a 128k -compression_level 8 -qscale:a 2 "${tempPath}.mp3"`;
                    exec(commandAudio, (err) => {
                        if (err) {
                            logger.error(`Error occurred while compressing video format: ${String(err)}`);
                            return res.status(500).json({ error: 'Something went wrong' });
                        }
                        fs.unlinkSync(filePath);
          
                        fs.renameSync(`${tempPath}.mp3`, `${compressedPath}.mp3`);

                        filePath = compressedPath;

                        next();
                    });
                    return;
                default:
                    fs.copyFileSync(req.file.path, compressedPath);
                    break;
                }
          
                fs.unlinkSync(req.file.path);
          
                fs.renameSync(tempPath, compressedPath);

                req.file.path = compressedPath;
            } else {
                throw new Error('No file uploaded');
            }

            // Call the next middleware or route handler
            next();
        });
    } catch (err) {
        logger.error(`Error occurred while compressing image: ${err as string}`);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export default uploadWithCompression;
