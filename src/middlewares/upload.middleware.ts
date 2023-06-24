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
                case '.png':
                    req.file.filename = `${path.parse(req.file.filename).name}.png`;

                    logger.info(`Compressing ${fileExtension.toLowerCase()} image: ${req.file.filename}`);

                    await sharp(filePath)
                        .toFormat('png')
                        .png({ quality: 80 })
                        .toFile(`${compressedPath}.png`);

                    fs.unlinkSync(filePath);
            
                    filePath = `${compressedPath}.png`;

                    next();
                    break;
                case '.jpeg':
                case '.jpg':
                case '.webp':
                case '.tiff':
                case '.tif':
                case '.bmp':
                    req.file.filename = `${path.parse(req.file.filename).name}.jpeg`;

                    logger.info(`Compressing ${fileExtension.toLowerCase()} image: ${req.file.filename}`);
                    await sharp(filePath)
                        .toFormat('jpeg')
                        .jpeg({ quality: 80 })
                        .toFile(`${compressedPath}.jpeg`);
          
                    filePath = `${compressedPath}.jpeg`;

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
                    req.file.filename = `${path.parse(req.file.filename).name}.mp4`;

                    logger.info(`Compressing ${fileExtension.toLowerCase()} video: ${req.file.filename}`);
                    const commandVideo = `ffmpeg -i "${filePath}" -vcodec libx264 -crf 25 -preset veryslow "${tempPath}.mp4"`;
                    exec(commandVideo, (err) => {
                        if (err) {
                            logger.error(`Error occurred while compressing video format: ${String(err)}`);
                            throw new Error('Something went wrong');
                        }
                        fs.unlinkSync(filePath);
          
                        fs.renameSync(`${tempPath}.mp4`, `${compressedPath}.mp4`);

                        filePath = compressedPath;

                        next();
                    });
                    break;
                case '.mp3':
                case '.aac':
                case '.wav':
                case '.flac':
                case '.ogg':
                case '.wma':
                    req.file.filename = `${path.parse(req.file.filename).name}.mp3`;
                    
                    logger.info(`Compressing ${fileExtension.toLowerCase()} audio: ${req.file.filename}`);
                    const commandAudio = `ffmpeg -i "${filePath}" -codec:a libmp3lame -b:a 128k -compression_level 8 -qscale:a 2 "${tempPath}.mp3"`;
                    exec(commandAudio, (err) => {
                        if (err) {
                            logger.error(`Error occurred while compressing video format: ${String(err)}`);
                            throw new Error('Something went wrong');
                        }
                        fs.unlinkSync(filePath);
          
                        fs.renameSync(`${tempPath}.mp3`, `${compressedPath}.mp3`);

                        filePath = compressedPath;

                        next();
                    });
                    break;
                default:
                    fs.copyFileSync(req.file.path, compressedPath);
                    break;
                }
            } else {
                throw new Error('No file uploaded');
            }

            next();
        });
    } catch (err) {
        logger.error(`Error occurred while compressing file: ${err as string}`);
        return res.status(500).json({ error: 'Something went wrong' });
    }
};

export default uploadWithCompression;
