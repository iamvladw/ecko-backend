import os from 'os';
import osu from 'node-os-utils';
import config from './config.helper';
import logger from '../helpers/winston.helper';

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
        if (config.allowRoot) {
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
        if (config.debug) {
            try {
                logger.log(
                    'debug',
                    `CPU model loaded as ${osu.cpu.model()} with Cores x${osu.cpu.count()}`
                );
            } catch {
                logger.log('debug', 'Failed to fetch the current cpu model!');
            }

            logger.log(
                'debug',
                `OS was detected as ${os.platform()} ${os.arch()} ${os.machine()} `
            );
            logger.log(
                'debug',
                `Uptime of the system is ${helperFunctions.uptime(os.uptime())}`
            );
            logger.log('debug', `PID of this process is ${process.pid}`);
            logger.log(
                'debug',
                `Local version of the node is ${process.version}`
            );
        }
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
}
