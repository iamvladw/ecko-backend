import { execSync } from 'child_process';
import logger from '../helpers/winston.helper';

export default class helperGithub {
    public static getBranch() {
        return `${execSync('git rev-parse --abbrev-ref HEAD').toString()}`;
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
}
