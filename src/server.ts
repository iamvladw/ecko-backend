import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logger from './helpers/winston.helper';
import indexRouter from './routes/public.route';
import systemRouter from './routes/system.route';
import authRouter from './routes/auth.route';
import userRouter from './routes/users.route';
import interestRouter from './routes/interests.route';
import badgesRouter from './routes/badges.route';
import config from './helpers/config.helper';
import helperFunctions from './helpers/functions.helper';
import helperGithub from './helpers/github.helper';
import { helperDatabase } from './helpers/database.helper';
import serverStatus from './middlewares/server.middleware';
import checkDatabaseConnection from './middlewares/database.middleware';
import { helperReplication } from './helpers/replication.helper';
import helperSetup from './helpers/setup.helper';
import requestLoggerMiddleware from './middlewares/request.middleware';
import limiter from './middlewares/rate.middleware';
import helperEcko from './helpers/ecko.helper';
import banChecker from './middlewares/ban.middleware';

const serverAPI = express();
const eckoAPIServer = helperEcko.initializeEckoServer(serverAPI);

// Define local variables
let serverEnabled = false;

// Define config variables
const PORT = config.port;
const DNS = config.dns;

// Loads middleware functions
serverAPI.use(express.json());
serverAPI.use(express.urlencoded({ extended: false }));
serverAPI.use(banChecker);
serverAPI.use(helmet());
serverAPI.use(compression());
serverAPI.use(cookieParser());
serverAPI.use(limiter);
serverAPI.use(serverStatus);
serverAPI.use(checkDatabaseConnection);
serverAPI.use(requestLoggerMiddleware);

// Enables the use for F-Forwarded-For header
serverAPI.enable('trust proxy');

// Define api routes
serverAPI.use('/', indexRouter);
serverAPI.use('/system', systemRouter);
serverAPI.use('/auth', authRouter);
serverAPI.use('/users', userRouter);
serverAPI.use('/interests', interestRouter);
serverAPI.use('/badges', badgesRouter);

// Start the express ecko server
try {
    eckoAPIServer.listen(PORT, DNS, async () => {
        logger.info('███████╗ ██████╗██╗  ██╗ ██████╗ ');
        logger.info('██╔════╝██╔════╝██║ ██╔╝██╔═══██╗');
        logger.info('█████╗  ██║     █████╔╝ ██║   ██║');
        logger.info('██╔══╝  ██║     ██╔═██╗ ██║   ██║');
        logger.info('███████╗╚██████╗██║  ██╗╚██████╔╝');
        logger.info('╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ');

        // Displays git info
        await helperGithub.displayGit();

        // Starts the first time setup of the server
        await helperSetup.initializeServerSetup();

        // Checking the privileges of the process
        helperFunctions.rootPrivileges();

        // Checks the API auth method
        helperEcko.validateApiAuthMethod();

        // Connecting to the database
        await helperDatabase.initializeDatabaseConnection();

        // Initializes the master sync
        await helperDatabase.initializeMasterSync();

        // Checks if the database is up-to-date
        await helperReplication.performReplication();

        // Syncs the file records
        await helperEcko.syncFileRecords();

        // Loads that stats
        helperFunctions.loadStats();

        // Starts the CDN server
        helperEcko.initializeEckoCDNServer(helperEcko.serverCDN);

        // Starts the WebSocket server
        helperEcko.initializeEckoWebSocketServer();

        serverEnabled = true;
        logger.info(`API is running on: ${config.protocol}://${DNS}:${PORT}`);
    });
} catch (err) {
    logger.error(`Error while trying to start the server: ${err as string}`);
    process.exit(1);
}

export { serverAPI, eckoAPIServer, serverEnabled };
