import { Config } from '../interfaces/config.interface';
import fs from 'fs';
import helperCache from './cache.helper';

const configPath = './config.json';

let config: Config;

if (!helperCache.get.server.config) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
} else {
    config = helperCache.get.server.config;
}

export default config;
