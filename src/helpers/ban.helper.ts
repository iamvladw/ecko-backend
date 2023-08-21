import helperCache from './cache.helper';
import helperFunctions from './functions.helper';
import logger from './winston.helper';

class helperBan {
    public static async banIP(ip: string) {
        try {
            logger.warn(`Attempting to ban the ip address ${ip}...`);

            const ipInfo = await helperFunctions.getCountryInfo(ip);

            helperCache.get.server.banPool[ip] = ipInfo;
            helperCache.update();

            logger.log('success', `IP ${ip} has been banned from the server`);
        } catch(err) {
            logger.error(`Error while trying to ban IP ${ip}: ${err as string}`);
        }
    }
    
    public static unbanIP(ip: string) {
        try {
            delete helperCache.get.server.banPool[ip];
            helperCache.update();

            logger.log('success', `IP ${ip} has been unbanned from the server`);
        } catch(err) {
            logger.error(`Error while trying to unban IP ${ip}: ${err as string}`);
        }
    }
}

export default helperBan;
