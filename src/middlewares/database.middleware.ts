import { NextFunction, Request, Response } from 'express';
import { masterInstance, helperDatabase } from '../helpers/database.helper';
import logger from '../helpers/winston.helper';

// Middleware to check database connection
const checkDatabaseConnection = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (await helperDatabase.isConnectionEstablished(masterInstance)) {
        next();
    } else {
        // Attempt to connect to backup databases
        logger.warn('Attempting to connect to backup databases...');
        await helperDatabase.initializeBackupDatabases();

        next();
    }
};

export default checkDatabaseConnection;
