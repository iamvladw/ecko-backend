import { JSONData } from '../interfaces/cache.interface';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.join(__dirname, '../../cache.json');

class helperCache {
    // Read data from JSON file
    private static fetch() {
        try {
            this.create();
            const fileData = fs.readFileSync(cacheFilePath, 'utf8');
            const jsonData = JSON.parse(fileData) as JSONData;
            return jsonData;
        } catch (err) {
            this.create();
            throw new Error(
                `Error while trying to read ${cacheFilePath}: ${err as string}`
            );
        }
    }

    public static get: JSONData = this.fetch();

    // Write data to JSON file
    public static update() {
        try {
            this.create();
            const jsonData = JSON.stringify(this.get);
            fs.writeFileSync(cacheFilePath, jsonData, 'utf8');
        } catch (err) {
            this.create();
            throw new Error(
                `Error while trying to write ${cacheFilePath}: ${err as string}`
            );
        }
    }

    // Create cache folder
    public static create() {
        try {
            if (!fs.existsSync(cacheFilePath)) {
                fs.writeFileSync(
                    cacheFilePath,
                    '{"server":{},"data":{"fileRecords":{}}}',
                    'utf8'
                );
            }
        } catch (err) {
            throw new Error(
                `Error while trying to create ${cacheFilePath}: ${err as string}`
            );
        }
    }
}

export default helperCache;
