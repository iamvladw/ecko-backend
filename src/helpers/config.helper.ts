import { Config } from '../interfaces/config.interface';
import fs from 'fs';

const configPath = './config.json';

const config: Config = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
) as Config;

export default config;
