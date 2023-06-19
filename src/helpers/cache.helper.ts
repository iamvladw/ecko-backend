import { JSONData } from '../interfaces/cache.interface';
import logger from './winston.helper';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.join(__dirname, '../../cache/cache.json');
const cachePath = path.join(__dirname, '../../cache/');

class helperCache {
    // Read data from JSON file
    private static fetch() {
        try {
            if (!fs.existsSync(cacheFilePath)) {
                // File doesn't exist, create it
                fs.mkdir(cachePath, { recursive: true }, (err) => {
                    fs.writeFileSync(cacheFilePath, '{}', 'utf8');
                    if (err) {
                        logger.error('Error creating directory:', err);
                    }
                });
            }

            const fileData = fs.readFileSync(cacheFilePath, 'utf8');
            const jsonData = JSON.parse(fileData) as JSONData;
            return jsonData;
        } catch (err) {
            logger.error('Error reading data from file:', err);
        }
    }

    public static instance: JSONData = this.fetch() as JSONData;

    // Write data to JSON file
    public static update() {
        try {
            if (!fs.existsSync(cacheFilePath)) {
                // File doesn't exist, create it
                fs.mkdir(cachePath, { recursive: true }, (err) => {
                    if (err) {
                        logger.error('Error creating directory:', err);
                    }
                });

                fs.writeFileSync(cacheFilePath, '{}', 'utf8');
            }

            const jsonData = JSON.stringify(this.instance);
            fs.writeFileSync(cacheFilePath, jsonData, 'utf8');
        } catch (err) {
            logger.error('Error writing data to file:', err);
        }
    }
}

export default helperCache;
