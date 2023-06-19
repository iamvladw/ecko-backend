import { execSync } from 'child_process';
import logger from '../helpers/winston.helper';
import axios from 'axios';

export default class helperGithub {
    public static getBranch() {
        return `${execSync('git rev-parse --abbrev-ref HEAD')
            .toString()
            .trim()}`;
    }

    public static getCommit() {
        return `${execSync('git rev-parse HEAD')
            .toString()
            .trim()
            .slice(0, 7)}`;
    }

    public static displayGit() {
        try {
            logger.info(
                `Backend Server | Branch: ${helperGithub.getBranch()} | Commit: ${helperGithub.getCommit()}`
            );
        } catch (err) {
            logger.warn(
                'Something went wrong with the .git folder or is not installed on the system.'
            );
        }
    }

    public static async getGitHubPackageVersion() {
        try {
            const response = await axios.get(
                `https://raw.githubusercontent.com/iamvladw/ecko-backend/${helperGithub.getBranch()}/package.json`
            );
            const content: string = response.data.version;
            return content;
        } catch (error) {
            logger.error('Error retrieving GitHub package version:', error);
            return 'Error retrieving GitHub package version';
        }
    }
}
