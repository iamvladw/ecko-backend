import os from 'os';
import osu from 'node-os-utils';
import config from './config.helper';
import logger from '../helpers/winston.helper';
import axios from 'axios';

export default class helperFunctions {
    public static delay(ms: number) {
        return new Promise((resolve) => {
            return setTimeout(resolve, ms);
        });
    }

    public static randomString(length: number) {
        let result = '';
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>?:"{}_+)(*&^%$#@!~`';
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
            counter += 1;
        }
        return result;
    }

    public static hideString(length: number) {
        let result = '';

        for (let i = 0; i < length; i++) {
            result = result + '*';
        }

        return result;
    }

    public static rootPrivileges() {
        if (config.runAsRoot) {
            if (
                (process.getuid && process.getuid() === 0) ||
                os.userInfo().username == 'root' ||
                os.userInfo().username == 'Administrator'
            ) {
                logger.warn(`You run the server as ${os.userInfo().username}`);
                logger.warn(
                    'Running the server with root privileges is forbidden due to security reasons.'
                );
                logger.warn(
                    'If you want to run the server with root privileges you need to edit the config file'
                );
                logger.warn(
                    'REMEMBER, I(VLAD WHITE) AM NOT RESPONSIBLE FOR ANY DATA LOSS OR SECURITY BREACH IN YOUR SYSTEM.'
                );
                logger.warn(
                    'BY REMOVING THIS PROTECTION YOU TAKE FULL RESPONSIBILITY IN CASE SOMETHING GOES WRONG!'
                );
            } else {
                logger.info(`You run the server as ${os.userInfo().username}`);
            }
        } else {
            logger.info(`You run the server as ${os.userInfo().username}`);
        }
    }

    public static loadStats() {
        try {
            logger.info(
                `CPU model loaded as ${osu.cpu.model()} with Cores x${osu.cpu.count()}`
            );
        } catch (err) {
            logger.error(
                `Error while trying to load CPU model: ${err as string}`
            );
        }

        logger.info(
            `OS was detected as ${os.platform()} ${os.arch()} ${os.machine()} `
        );
        logger.info(`Uptime of the system is ${this.uptime(os.uptime())}`);
        logger.info(`PID of this process is ${process.pid}`);
        logger.info(`Local version of the node is ${process.version}`);
    }

    public static uptime(osuptime: number) {
        let ut_sec = osuptime;
        let ut_min = ut_sec / 60;
        let ut_hour = ut_min / 60;
        let ut_day = ut_hour / 24;

        ut_sec = Math.floor(ut_sec);
        ut_min = Math.floor(ut_min);
        ut_hour = Math.floor(ut_hour);
        ut_day = Math.floor(ut_day);

        ut_day = ut_day % 24;
        ut_hour = ut_hour % 60;
        ut_min = ut_min % 60;
        ut_sec = ut_sec % 60;

        return `${ut_day} Day(s) ${ut_hour} Hour(s) ${ut_min} Minute(s) ${ut_sec} Second(s)`;
    }

    public static formatBytes(bytes: number): string {
        const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
        let suffixIndex = 0;
        let size = bytes;

        while (size >= 1024 && suffixIndex < suffixes.length - 1) {
            size /= 1024;
            suffixIndex++;
        }

        return `${size.toFixed(2)} ${suffixes[suffixIndex]}`;
    }

    public static formatNumber(number: number): string {
        const suffixes = ['', 'k', 'M', 'B', 'T'];
        const suffixNum = Math.floor(String(number).length / 4);
        let shortValue = parseFloat(
            (number / Math.pow(1000, suffixNum)).toFixed(1)
        );
        if (shortValue % 1 !== 0) {
            shortValue = Number(shortValue.toFixed(1));
        }
        return `${shortValue}${suffixes[suffixNum]}`;
    }

    public static async getPublicIPAddress(): Promise<string> {
        const response = await axios.get('https://api.ipify.org?format=json');
        return String(response.data.ip);
    }

    public static async getCountryInfo(ipAddress: string): Promise<string> {
        const apiKey = 'YOUR_API_KEY';
        const response = await axios.get(
            `http://ip-api.com/json/${ipAddress}?fields=country`
        );
        return String(response.data.country);
    }

    public static getLocalIPAddress() {
        const interfaces = os.networkInterfaces();
        for (const interfaceName in interfaces) {
            const networkInterface = interfaces[interfaceName];
            if (networkInterface) {
                for (const addressInfo of networkInterface) {
                    if (
                        addressInfo.family === 'IPv4' &&
                        !addressInfo.internal
                    ) {
                        return addressInfo.address;
                    }
                }
            }
        }
        return null;
    }

    public static parseExpiration(expiration: string): number {
        const durationRegex = /^(\d+)([smhdwMy]?)$/;
        const matches = expiration.match(durationRegex);
        if (!matches) {
            throw new Error('Invalid expiration format');
        }
      
        const value = parseInt(matches[1]);
        const unit = matches[2];
      
        let milliseconds = 0;
        switch (unit) {
        case 's':
            milliseconds = value * 1000;
            break;
        case 'm':
            milliseconds = value * 60 * 1000;
            break;
        case 'h':
            milliseconds = value * 60 * 60 * 1000;
            break;
        case 'd':
            milliseconds = value * 24 * 60 * 60 * 1000;
            break;
        case 'w':
            milliseconds = value * 7 * 24 * 60 * 60 * 1000;
            break;
        case 'M':
            milliseconds = value * 30 * 24 * 60 * 60 * 1000;
            break;
        case 'y':
            milliseconds = value * 365 * 24 * 60 * 60 * 1000;
            break;
        default:
            throw new Error('Invalid expiration unit');
        }
      
        return milliseconds;
    }
}
