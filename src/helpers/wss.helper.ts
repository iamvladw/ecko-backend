import { wss } from '../interfaces/wss.interface';
import helperCache from './cache.helper';
import helperEcko from './ecko.helper';
import helperFunctions from './functions.helper';
import helperGithub from './github.helper';
import packageJson from './package.helper';
import os from 'os';

const wssData: wss = {
    public: {
        currentBranch: helperGithub.getBranch(),
        currentCommit: helperGithub.getCommit(),
        currentVersion: packageJson.version,
        memUsage: helperFunctions.bytesToGB(os.totalmem() - os.freemem()),
        requests: helperFunctions.formatNumber(
            helperCache.instance.data.numberOfRequests
        ),
        responses: helperFunctions.formatNumber(
            helperCache.instance.data.numberOfResponses
        )
    }
};

export { wssData };
