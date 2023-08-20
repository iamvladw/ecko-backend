import * as CryptoJS from 'crypto-js';
import logger from './winston.helper';
import helperCache from './cache.helper';

class helperAES {
    public static encrypt(
        value: string | CryptoJS.lib.WordArray,
        secret?: string
    ) {
        try {
            const key = CryptoJS.enc.Utf8.parse(
                secret ?? helperCache.get.server.secret
            );
            const ciphertext = CryptoJS.AES.encrypt(value, key, {iv: key}).toString();
            return ciphertext;
        } catch (err) {
            logger.error(
                `Error while trying to encrypt ${value as string}: ${
                    err as string
                }`
            );
        }
    }

    public static decrypt(
        value: string | CryptoJS.lib.CipherParams,
        secret?: string
    ) {
        try {
            const key = CryptoJS.enc.Utf8.parse(
                secret ?? helperCache.get.server.secret
            );
            const decryptedData = CryptoJS.AES.decrypt(value, key, { iv: key });
            return decryptedData.toString(CryptoJS.enc.Utf8);
        } catch (err) {
            logger.error(
                `Error while trying to decrypt ${value as string}: ${
                    err as string
                }`
            );
        }
    }
}

export default helperAES;
