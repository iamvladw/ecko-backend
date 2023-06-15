import { DataSource, FindOptionsWhere } from 'typeorm';
import config from './config.helper';
import logger from '../helpers/winston.helper';
import User from '../interfaces/user.interface';
import { MongoDBUser, MySQLUser } from '../database/entities/user.entity';
import {
    SupportedDatabaseRole,
    SupportedDatabaseType
} from '../interfaces/config.interface';
import { helperReplication } from './replication.helper';
import { CordovaConnectionOptions } from 'typeorm/driver/cordova/CordovaConnectionOptions';
import helperCache from './cache.helper';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import {
    MongoDBInterest,
    MongoDBInterestGroup,
    MySQLInterest,
    MySQLInterestGroup
} from '../database/entities/interests.entity';
import { Interest, InterestGroup } from '../interfaces/interest.interface';

let currentDatabase: string;
let masterInstance: DataSource;
let initialMasterDatabase: string;

export class helperDatabase {
    public static async initializeDatabaseConnection() {
        this.setCurrentDatabase(
            this.fetchDatabaseByRole('master', true) as string
        );
        initialMasterDatabase = String(currentDatabase);
        const databaseConfig = config.databases[currentDatabase];

        if (currentDatabase.length > 1) {
            logger.error(
                'The server cannot have multiple master databases enabled. '
            );
            return this.initializeBackupDatabases();
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!databaseConfig) {
            logger.error('The server wan\'t able to fetch the master database.');
            return this.initializeBackupDatabases();
        }

        logger.info('Connecting to the database...');

        switch (databaseConfig.type) {
        case 'mysql':
        case 'mariadb':
        case 'mongodb':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                url: databaseConfig.url,
                charset: databaseConfig.charset,
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations
            });
            break;
        case 'mssql':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                url: databaseConfig.url,
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations,
                options: databaseConfig.options
            });
            break;
        case 'postgres':
        case 'cockroachdb':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                url: databaseConfig.url,
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations
            } as PostgresConnectionOptions);
            break;
        case 'sqlite':
        case 'better-sqlite3':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                database: databaseConfig.database ?? 'database-ecko.db',
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations
            });
            break;
        case 'capacitor':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                database: databaseConfig.database ?? 'database-ecko.db',
                driver: databaseConfig.driver,
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations
            });
            break;
        case 'cordova':
        case 'react-native':
        case 'nativescript':
            masterInstance = new DataSource({
                type: databaseConfig.type,
                database: databaseConfig.database ?? 'database-ecko.db',
                driver: databaseConfig.driver,
                location: databaseConfig.driver,
                synchronize: databaseConfig.synchronize,
                logging: databaseConfig.logging,
                entities: helperDatabase.fetchEntitiesByType(
                    databaseConfig.type
                ),
                migrations: databaseConfig.migrations
            } as CordovaConnectionOptions);
            break;
        default:
            logger.error(
                `Unsupported database type: ${
                        databaseConfig.type as string
                }`
            );
            process.exit(1);
        }

        try {
            await masterInstance.initialize();

            logger.info(`Master database detected: ${currentDatabase}`);
            logger.info(`Master database type: ${databaseConfig.type}`);
            logger.log('success', 'Connected to the master database');
        } catch (err) {
            logger.error(
                `Error connecting to the master database ${currentDatabase}: ${
                    err as string
                }`
            );
            await this.initializeBackupDatabases();
        }

        if (config.databases[currentDatabase].synchronize) {
            logger.info(
                `Attempting tables synchronization for ${currentDatabase}`
            );

            await masterInstance
                .synchronize()
                .then(() => {
                    return logger.log(
                        'success',
                        'Tables have been synchronized'
                    );
                })
                .catch((err) => {
                    logger.error('Database sync error:', err);
                    process.exit(1);
                });
        }
    }

    public static async initializeBackupDatabases() {
        const backupDatabases = this.fetchDatabaseByRole(
            'backup',
            true
        ) as string[];

        if (backupDatabases.length === 0) {
            logger.error(
                'The server wan\'t able to fetch any backup databases. Shutting down the server...'
            );
            return process.exit(1);
        }

        logger.warn(
            `Attempting to connect to backup databases: ${String(
                backupDatabases
            )}`
        );

        for (const dbName of backupDatabases) {
            try {
                const databaseConfig = config.databases[dbName];

                if (databaseConfig.enabled) {
                    switch (databaseConfig.type) {
                    case 'mysql':
                    case 'mariadb':
                    case 'mongodb':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            url: databaseConfig.url,
                            charset: databaseConfig.charset,
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations
                        });
                        break;
                    case 'mssql':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            url: databaseConfig.url,
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations,
                            options: databaseConfig.options
                        });
                        break;
                    case 'postgres':
                    case 'cockroachdb':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            url: databaseConfig.url,
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations
                        } as PostgresConnectionOptions);
                        break;
                    case 'sqlite':
                    case 'better-sqlite3':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            database:
                                    databaseConfig.database ??
                                    'database-ecko.db',
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations
                        });
                        break;
                    case 'capacitor':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            database:
                                    databaseConfig.database ??
                                    'database-ecko.db',
                            driver: databaseConfig.driver,
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations
                        });
                        break;
                    case 'cordova':
                    case 'react-native':
                    case 'nativescript':
                        masterInstance = new DataSource({
                            type: databaseConfig.type,
                            database:
                                    databaseConfig.database ??
                                    'database-ecko.db',
                            driver: databaseConfig.driver,
                            location: databaseConfig.driver,
                            synchronize: databaseConfig.synchronize,
                            logging: databaseConfig.logging,
                            entities: helperDatabase.fetchEntitiesByType(
                                databaseConfig.type
                            ),
                            migrations: databaseConfig.migrations
                        } as CordovaConnectionOptions);
                        break;
                    }
                    await masterInstance.initialize();

                    this.setCurrentDatabase(dbName);

                    config.databases[currentDatabase].role = 'master';

                    logger.log(
                        'success',
                        `Connected to the backup database: ${dbName}`
                    );

                    if (helperCache.instance.lastDatabaseLoaded) {
                        try {
                            if (
                                String(dbName) !==
                                    helperCache.instance.lastDatabaseLoaded &&
                                config.databases[
                                    helperCache.instance.lastDatabaseLoaded
                                ].role !== 'master'
                            ) {
                                config.databases[
                                    helperCache.instance.lastDatabaseLoaded
                                ].role = 'master';

                                config.databases[dbName].role = 'backup';

                                logger.warn(
                                    `The backup database ${dbName} is of of sync because of the last connection disruption.`
                                );
                                logger.warn(
                                    'Attempting to perform replication of the last backup database loaded...'
                                );

                                if (
                                    await this.initializeBackupDatabase(
                                        helperCache.instance.lastDatabaseLoaded
                                    )
                                ) {
                                    await helperReplication.performReplication();

                                    logger.log(
                                        'success',
                                        `Data replication for the backup database ${dbName} was successful. The backup database is now up-to-date.`
                                    );

                                    helperCache.instance.lastDatabaseLoaded =
                                        String(dbName);
                                    helperCache.update();

                                    config.databases[dbName].role = 'backup';
                                    config.databases[
                                        helperCache.instance.lastDatabaseLoaded
                                    ].role = 'backup';

                                    await this.initializeBackupDatabases();
                                } else {
                                    helperCache.instance.lastDatabaseLoaded =
                                        String(dbName);
                                    helperCache.update();

                                    logger.error(
                                        `Error while connecting to the last loaded backup database ${dbName}`
                                    );
                                    logger.warn(
                                        `Data replication for the backup database ${dbName} has failed...`
                                    );
                                    logger.warn(
                                        'Retrying to perform replication in the next session...'
                                    );
                                    await this.initializeBackupDatabases();
                                }
                            }
                        } catch (err) {
                            logger.error(
                                'Failed to initialize backup database replication'
                            );
                            logger.error(`${String(err)}`);
                        }
                    } else {
                        helperCache.instance.lastDatabaseLoaded =
                            String(dbName);
                        helperCache.update();
                    }
                    break;
                }
            } catch (err) {
                if (config.debug) {
                    logger.error(
                        `Failed to connect to the database: ${dbName}`
                    );
                    logger.error(`${String(err)}`);
                }
            }
        }

        if (!masterInstance.isInitialized) {
            logger.error(
                'Failed to connect to any backup databases. Shutting down the server...'
            );
            process.exit(1);
        }
    }

    public static async initializeBackupDatabase(databaseName: string) {
        const backupDatabases = this.fetchDatabaseByRole(
            'backup',
            true
        ) as string[];

        if (backupDatabases.length === 0) {
            logger.error(
                'The server wan\'t able to fetch any backup databases. Shutting down the server...'
            );
            return process.exit(1);
        }

        if (databaseName) {
            try {
                const databaseConfig = config.databases[databaseName];

                if (!databaseConfig.enabled) {
                    return logger.error(
                        `The backup database ${databaseName} is not enabled.`
                    );
                }

                switch (databaseConfig.type) {
                case 'mysql':
                case 'mariadb':
                case 'mongodb':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        url: databaseConfig.url,
                        charset: databaseConfig.charset,
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations
                    });
                    break;
                case 'mssql':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        url: databaseConfig.url,
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations,
                        options: databaseConfig.options
                    });
                    break;
                case 'postgres':
                case 'cockroachdb':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        url: databaseConfig.url,
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations
                    } as PostgresConnectionOptions);
                    break;
                case 'sqlite':
                case 'better-sqlite3':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        database:
                                databaseConfig.database ?? 'database-ecko.db',
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations
                    });
                    break;
                case 'capacitor':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        database:
                                databaseConfig.database ?? 'database-ecko.db',
                        driver: databaseConfig.driver,
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations
                    });
                    break;
                case 'cordova':
                case 'react-native':
                case 'nativescript':
                    masterInstance = new DataSource({
                        type: databaseConfig.type,
                        database:
                                databaseConfig.database ?? 'database-ecko.db',
                        driver: databaseConfig.driver,
                        location: databaseConfig.driver,
                        synchronize: databaseConfig.synchronize,
                        logging: databaseConfig.logging,
                        entities: helperDatabase.fetchEntitiesByType(
                            databaseConfig.type
                        ),
                        migrations: databaseConfig.migrations
                    } as CordovaConnectionOptions);
                    break;
                }
                await masterInstance.initialize();

                this.setCurrentDatabase(databaseName);

                config.databases[currentDatabase].role = 'master';

                helperCache.instance.lastDatabaseLoaded = databaseName;
                helperCache.update();

                logger.warn(
                    `Attempting to connect to backup database: ${databaseName}`
                );

                logger.log(
                    'success',
                    `Connected to the backup database: ${databaseName}`
                );
                return true;
            } catch (err: unknown) {
                if (config.debug) {
                    logger.error(
                        `Failed to connect to the database: ${databaseName}`
                    );
                    logger.error(`${String(err)}`);
                }
                return false;
            }
        }
    }

    public static async initializeMasterSync() {
        try {
            if (
                String(currentDatabase) !==
                    helperCache.instance.lastDatabaseLoaded &&
                config.databases[helperCache.instance.lastDatabaseLoaded]
                    .role !== 'master'
            ) {
                logger.warn(
                    'The master database is of of sync because of the last connection disruption.'
                );
                logger.warn(
                    'Attempting to synchronize it with the last backup database loaded...'
                );

                await this.initializeBackupDatabase(
                    helperCache.instance.lastDatabaseLoaded
                );

                config.databases[initialMasterDatabase].role = 'backup';

                await helperReplication.performReplication();

                logger.log(
                    'success',
                    'Data synchronization for the master database was successful. The master database is now up-to-date.'
                );

                config.databases[initialMasterDatabase].role = 'master';
                config.databases[currentDatabase].role = 'backup';

                await this.initializeDatabaseConnection();

                helperCache.instance.lastDatabaseLoaded = String(
                    initialMasterDatabase
                );

                helperCache.update();
            }
        } catch (err) {
            logger.error(
                'Failed to initialize master database synchronization'
            );
            if (config.debug) {
                logger.error(`${err as string}`);
            }
        }
    }

    public static fetchDatabaseByRole(
        role: SupportedDatabaseRole,
        enabled?: boolean
    ): string | string[] {
        const databases = config.databases;

        const dbPool: string[] = [];

        for (const databaseName of Object.keys(databases)) {
            if (databases[databaseName].role === role) {
                if (enabled) {
                    if (config.databases[databaseName].enabled) {
                        dbPool.push(databaseName);
                    }
                } else {
                    dbPool.push(databaseName);
                }
            }
        }

        return dbPool;
    }

    public static fetchEntitiesByType(databaseType: SupportedDatabaseType) {
        switch (databaseType) {
        case 'mysql':
        case 'mariadb':
        case 'mssql':
        case 'postgres':
        case 'cockroachdb':
        case 'sqlite':
        case 'better-sqlite3':
        case 'capacitor':
        case 'cordova':
        case 'react-native':
        case 'nativescript':
            return [MySQLUser, MySQLInterestGroup, MySQLInterest];
        case 'mongodb':
            return [MongoDBUser, MongoDBInterestGroup, MongoDBInterest];
        default:
            logger.error(
                `Unsupported database type: ${databaseType as string}`
            );
            process.exit(1);
        }
    }

    public static setCurrentDatabase(database: string) {
        currentDatabase = database;
    }

    public static async isConnectionEstablished(databaseInstance: DataSource) {
        try {
            switch (config.databases[currentDatabase].type) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                await databaseInstance
                    .getRepository(MySQLUser)
                    .query('SELECT 1');
                return true;
            case 'mongodb':
                await databaseInstance.getRepository(MongoDBUser).count();
                return true;
            }
        } catch (err) {
            logger.warn(
                'Connection to the master database has been disrupted.'
            );
            return false;
        }
    }

    public static async addUser(
        databaseInstance: DataSource,
        userInstance: User,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;
            const user = helperReplication.mapUserFields(
                userInstance,
                databaseType
            );

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info('Adding the user to the database...');

                await databaseInstance.getRepository(MySQLUser).save(user);
                break;
            case 'mongodb':
                logger.info('Adding the user to the database...');

                await databaseInstance
                    .getRepository(MongoDBUser)
                    .save(user);
                break;
            }

            logger.log(
                'success',
                `The user ${JSON.stringify(
                    userInstance.uuid
                )} has been added successfully`
            );

            return true;
        } catch (err) {
            logger.error(
                `Error during adding the user {"uuid":${JSON.stringify(
                    userInstance.uuid
                )}}: ${err as string}`
            );
            return false;
        }
    }

    public static async editUser(
        databaseInstance: DataSource,
        uuid: string,
        updatedUser: MySQLUser | MongoDBUser | User,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                await databaseInstance
                    .getRepository(MySQLUser)
                    .update({ uuid: uuid }, updatedUser as MySQLUser);
                break;
            case 'mongodb':
                await databaseInstance
                    .getRepository(MongoDBUser)
                    .update({ uuid: uuid }, updatedUser as MongoDBUser);
                break;
            }

            logger.log(
                'success',
                `The user ${JSON.stringify({
                    uuid: uuid
                })} has been edited successfully`
            );

            return true;
        } catch (err) {
            logger.error(
                `Error during editing the user ${JSON.stringify({
                    uuid: uuid
                })}: ${err as string}`
            );
            return false;
        }
    }

    public static async removeUser(
        databaseInstance: DataSource,
        uuid: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                await databaseInstance
                    .getRepository(MySQLUser)
                    .delete({ uuid: uuid });
                break;
            case 'mongodb':
                await databaseInstance
                    .getRepository(MongoDBUser)
                    .delete({ uuid: uuid });
                break;
            }

            logger.log(
                'success',
                `The user ${JSON.stringify({
                    uuid: uuid
                })} has been removed successfully`
            );

            return true;
        } catch (err) {
            logger.error(
                `Error during removing the user ${JSON.stringify({
                    uuid: uuid
                })}: ${err as string}`
            );
            return false;
        }
    }

    public static async fetchUsers(
        databaseInstance: DataSource,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let users: MySQLUser[] | MongoDBUser[] | null[];
            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                users = await databaseInstance.manager.find(MySQLUser);

                if (users.length > 0) {
                    logger.log(
                        'success',
                        `${users.length} Users have been fetched`
                    );
                    return users;
                } else {
                    logger.error('Failed to fetch users');
                    return false;
                }
            case 'mongodb':
                users = await databaseInstance.manager.find(MongoDBUser);

                if (users.length > 0) {
                    logger.log(
                        'success',
                        `${users.length} Users have been fetched`
                    );
                    return users;
                } else {
                    logger.error('Failed to fetch users');
                    return false;
                }
            }
        } catch (err) {
            logger.error(`Error while fetching users: ${err as string}`);
            logger.error(`${String(err)}`);
            return false;
        }
    }

    public static async fetchUser(
        databaseInstance: DataSource,
        identifier: FindOptionsWhere<MySQLUser> | FindOptionsWhere<MongoDBUser>,
        dbType?: SupportedDatabaseType
    ): Promise<MySQLUser | MongoDBUser | false> {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            logger.info(
                `Searching user based on: ${JSON.stringify(identifier)}`
            );

            let user: MySQLUser | MongoDBUser | null;
            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                user = await databaseInstance.manager.findOneBy(
                    MySQLUser,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `User ${
                            user.username
                        } has been fetched based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            case 'mongodb':
                user = await databaseInstance.manager.findOneBy(
                    MongoDBUser,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `User ${
                            user.username
                        } has been fetched ${JSON.stringify(identifier)}"}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            }
        } catch (err) {
            logger.error(
                `Error while getting user based on: ${JSON.stringify(
                    identifier
                )}`
            );
            logger.error(`${String(err)}`);
            return false;
        }
    }

    public static async addInterestGroup(
        databaseInstance: DataSource,
        interestGroupInstance: InterestGroup,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;
            const interestGroup = helperReplication.mapInterestGroupFields(
                interestGroupInstance,
                databaseType
            );

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info('Adding the interest group to the database...');

                await databaseInstance
                    .getRepository(MySQLInterestGroup)
                    .save(interestGroup);
                break;
            case 'mongodb':
                logger.info('Adding the interest group to the database...');

                await databaseInstance
                    .getRepository(MongoDBInterestGroup)
                    .save(interestGroup);
                break;
            }

            logger.log(
                'success',
                `The interest group ${JSON.stringify(
                    interestGroupInstance.uuid
                )} has been added successfully`
            );
        } catch (err) {
            logger.error(
                `Error during adding the interest group {"uuid":${JSON.stringify(
                    interestGroupInstance.uuid
                )}}: ${err as string}`
            );
        }
    }

    public static async editInterestGroup(
        databaseInstance: DataSource,
        uuid: string,
        updatedInterestGroup:
            | MySQLInterestGroup
            | MongoDBInterestGroup
            | InterestGroup,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Updating the interest group in the database...'
                );

                await databaseInstance
                    .getRepository(MySQLInterestGroup)
                    .update(
                        { uuid: uuid },
                            updatedInterestGroup as MySQLInterestGroup
                    );
                break;
            case 'mongodb':
                logger.info(
                    'Updating the interest group in the database...'
                );

                await databaseInstance
                    .getRepository(MongoDBUser)
                    .update(
                        { uuid: uuid },
                            updatedInterestGroup as MongoDBInterestGroup
                    );
                break;
            }

            logger.log(
                'success',
                `The interest group based on ${JSON.stringify({
                    uuid: uuid
                })} has been updated successfully`
            );
        } catch (err) {
            logger.error(
                `Error during updating the interest group {"uuid":${JSON.stringify(
                    {
                        uuid: uuid
                    }
                )}}: ${err as string}`
            );
        }
    }

    public static async removeInterestGroup(
        databaseInstance: DataSource,
        uuid: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let groupInterests;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Removing the interest group from the database...'
                );

                groupInterests = await databaseInstance.manager.findOneBy(
                    MySQLInterestGroup,
                    { uuid: uuid }
                );

                if (groupInterests) {
                    for (const interestUUID of groupInterests.interests) {
                        await databaseInstance
                            .getRepository(MySQLInterest)
                            .delete({ uuid: interestUUID });
                    }

                    await databaseInstance
                        .getRepository(MySQLInterestGroup)
                        .delete({ uuid: uuid });
                }

                break;
            case 'mongodb':
                logger.info(
                    'Removing the interest group from the database...'
                );

                groupInterests = await databaseInstance.manager.findOneBy(
                    MongoDBInterestGroup,
                    { uuid: uuid }
                );

                if (groupInterests) {
                    for (const interestUUID of groupInterests.interests) {
                        await databaseInstance
                            .getRepository(MongoDBInterest)
                            .delete({ uuid: interestUUID });
                    }

                    await databaseInstance
                        .getRepository(MongoDBInterestGroup)
                        .delete({ uuid: uuid });
                }
                break;
            }

            logger.log(
                'success',
                `The interest group ${JSON.stringify({
                    uuid: uuid
                })} has been removed successfully`
            );
        } catch (err) {
            logger.error(
                `Error during removing the interest group with ID ${JSON.stringify(
                    {
                        uuid: uuid
                    }
                )}: ${err as string}`
            );
        }
    }

    public static async fetchInterestGroups(
        databaseInstance: DataSource,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Fetching interest groups from the database...'
                );

                return await databaseInstance
                    .getRepository(MySQLInterestGroup)
                    .find();
            case 'mongodb':
                logger.info(
                    'Fetching interest groups from the database...'
                );

                return await databaseInstance
                    .getRepository(MongoDBInterestGroup)
                    .find();
            }
        } catch (err) {
            logger.error(
                `Error during fetching interest groups: ${err as string}`
            );
        }
    }

    public static async fetchInterestGroup(
        databaseInstance: DataSource,
        identifier:
            | FindOptionsWhere<MySQLInterestGroup>
            | FindOptionsWhere<MongoDBInterestGroup>,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            logger.info(
                `Searching user based on: ${JSON.stringify(identifier)}`
            );

            let user: MySQLInterestGroup | MongoDBInterestGroup | null;
            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                user = await databaseInstance.manager.findOneBy(
                    MySQLInterestGroup,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `Interest group ${
                            user.name
                        } has been fetched based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            case 'mongodb':
                user = await databaseInstance.manager.findOneBy(
                    MongoDBInterestGroup,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `Interest group ${
                            user.name
                        } has been fetched based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            }
        } catch (err) {
            logger.error(
                `Error during fetching interest groups: ${err as string}`
            );
            return [];
        }
    }

    public static async addInterest(
        databaseInstance: DataSource,
        interest: Interest,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;
            const mappedInterest = helperReplication.mapInterestFields(
                interest,
                databaseType
            );

            let interestReturn;
            let interestGroup;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info('Adding the interest to the database...');

                interestReturn = await databaseInstance
                    .getRepository(MySQLInterest)
                    .save(mappedInterest);

                interestGroup = await databaseInstance.manager.findOneBy(
                    MySQLInterestGroup,
                    { uuid: interestReturn.group }
                );

                if (interestGroup) {
                    interestGroup.interests.push(interestReturn.uuid);

                    await databaseInstance
                        .getRepository(MySQLInterestGroup)
                        .save(interestGroup);
                }

                break;
            case 'mongodb':
                logger.info('Adding the interest to the database...');

                interestReturn = await databaseInstance
                    .getRepository(MongoDBInterest)
                    .save(mappedInterest);

                interestGroup = await databaseInstance.manager.findOneBy(
                    MongoDBInterestGroup,
                    { uuid: interestReturn.group }
                );

                if (interestGroup) {
                    interestGroup.interests.push(interestReturn.uuid);
                    await databaseInstance
                        .getRepository(MongoDBInterestGroup)
                        .save(interestGroup);
                }

                break;
            }

            logger.log(
                'success',
                `The interest ${JSON.stringify(
                    interest.uuid
                )} has been added successfully`
            );
        } catch (err) {
            logger.error(
                `Error during adding the interest {"uuid": ${JSON.stringify(
                    interest.uuid
                )}}: ${err as string}`
            );
        }
    }

    public static async editInterest(
        databaseInstance: DataSource,
        uuid: string,
        interest: Interest,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info('Updating the interest in the database...');

                await databaseInstance
                    .getRepository(MySQLInterest)
                    .update({ uuid: uuid }, interest);
                break;
            case 'mongodb':
                logger.info('Updating the interest in the database...');

                await databaseInstance
                    .getRepository(MongoDBInterest)
                    .update({ uuid: uuid }, interest);
                break;
            }

            logger.log(
                'success',
                `The interest ${JSON.stringify(
                    interest.uuid
                )} has been updated successfully`
            );
        } catch (err) {
            logger.error(
                `Error during updating the interest {"uuid": ${JSON.stringify(
                    interest.uuid
                )}}: ${err as string}`
            );
        }
    }

    public static async removeInterest(
        databaseInstance: DataSource,
        uuid: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let interest;
            let groupInterests;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info('Removing the interest from the database...');

                interest = await databaseInstance.manager.findOneBy(
                    MySQLInterest,
                    {
                        uuid: uuid
                    }
                );

                if (interest) {
                    groupInterests =
                            await databaseInstance.manager.findOneBy(
                                MySQLInterestGroup,
                                { uuid: interest.group }
                            );

                    if (groupInterests) {
                        const interestUUID = interest.uuid;
                        groupInterests.interests =
                                groupInterests.interests.filter((uuid) => {
                                    return uuid !== interestUUID;
                                });
                        await databaseInstance
                            .getRepository(MySQLInterestGroup)
                            .update(
                                { uuid: groupInterests.uuid },
                                groupInterests
                            );
                    }

                    await databaseInstance
                        .getRepository(MySQLInterest)
                        .delete({ uuid: uuid });
                }

                break;
            case 'mongodb':
                logger.info('Removing the interest from the database...');

                interest = await databaseInstance.manager.findOneBy(
                    MongoDBInterest,
                    {
                        uuid: uuid
                    }
                );

                if (interest) {
                    groupInterests =
                            await databaseInstance.manager.findOneBy(
                                MongoDBInterestGroup,
                                { uuid: interest.group }
                            );

                    if (groupInterests) {
                        const interestUUID = interest.uuid;
                        groupInterests.interests.filter((uuid) => {
                            return uuid !== interestUUID;
                        });

                        await databaseInstance
                            .getRepository(MongoDBInterestGroup)
                            .update(groupInterests.uuid, groupInterests);
                    }

                    await databaseInstance
                        .getRepository(MongoDBInterest)
                        .delete({ uuid: uuid });
                }
                break;
            }

            logger.log(
                'success',
                `The interest ${JSON.stringify({
                    uuid: uuid
                })} has been removed successfully`
            );
        } catch (err) {
            logger.error(
                `Error during removal of the interest based on ${JSON.stringify(
                    {
                        uuid: uuid
                    }
                )}: ${err as string}`
            );
        }
    }

    public static async fetchInterests(
        databaseInstance: DataSource,
        dbType?: SupportedDatabaseType
    ): Promise<MySQLInterest[] | MongoDBInterest[] | []> {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                return await databaseInstance
                    .getRepository(MySQLInterest)
                    .find();
            case 'mongodb':
                return await databaseInstance
                    .getRepository(MongoDBInterest)
                    .find();
            default:
                return [];
            }
        } catch (err) {
            logger.error(`Error during fetching interests: ${err as string}`);
            return [];
        }
    }

    public static async fetchInterest(
        databaseInstance: DataSource,
        identifier:
            | FindOptionsWhere<MySQLInterest>
            | FindOptionsWhere<MongoDBInterest>,
        dbType?: SupportedDatabaseType
    ): Promise<MySQLInterest | MongoDBInterest | false> {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;
            let user;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                user = await databaseInstance.manager.findOneBy(
                    MySQLInterest,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `Interest group ${
                            user.name
                        } has been fetched based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            case 'mongodb':
                user = await databaseInstance.manager.findOneBy(
                    MongoDBInterest,
                    identifier
                );

                if (user) {
                    logger.log(
                        'success',
                        `Interest group ${
                            user.name
                        } has been fetched based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return user;
                } else {
                    logger.error(
                        `Failed to find the user based on: ${JSON.stringify(
                            identifier
                        )}`
                    );
                    return false;
                }
            }
        } catch (err) {
            logger.error(
                `Error during fetching interest groups: ${err as string}`
            );
            return false;
        }
    }

    public static async addFollowerToInterest(
        databaseInstance: DataSource,
        uuid: string,
        followerUUID: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let interest;
            let follower;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Adding a follower to the interest in the database...'
                );

                interest = await databaseInstance
                    .getRepository(MySQLInterest)
                    .findOneBy({ uuid: uuid });

                follower = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: followerUUID });

                if (interest && follower) {
                    if (!interest.followers.includes(followerUUID)) {
                        interest.followers.push(followerUUID);
                        follower.followedInterests.push(interest.uuid);

                        await databaseInstance
                            .getRepository(MySQLInterest)
                            .save(interest);

                        await databaseInstance
                            .getRepository(MySQLUser)
                            .save(follower);

                        logger.log(
                            'success',
                            `Follower ${followerUUID} has been add to the interest ${
                                interest.uuid
                            } based on: ${JSON.stringify({ uuid: uuid })}`
                        );

                        return true;
                    } else {
                        logger.error(
                            `Failed to add follower to the interest based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return false;
                    }
                }
                break;
            case 'mongodb':
                logger.info(
                    'Adding a follower to the interest in the database...'
                );

                interest = await databaseInstance
                    .getRepository(MongoDBInterest)
                    .findOneBy({ uuid: uuid });

                follower = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: followerUUID });

                if (interest && follower) {
                    if (!interest.followers.includes(followerUUID)) {
                        interest.followers.push(followerUUID);
                        follower.followedInterests.push(interest.uuid);

                        await databaseInstance
                            .getRepository(MongoDBInterest)
                            .save(interest);

                        await databaseInstance
                            .getRepository(MongoDBUser)
                            .save(follower);

                        logger.log(
                            'success',
                            `Follower ${followerUUID} has been add to the interest ${
                                interest.uuid
                            } based on: ${JSON.stringify({ uuid: uuid })}`
                        );

                        return true;
                    } else {
                        logger.error(
                            `Failed to add follower to the interest based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return false;
                    }
                }
            }
        } catch (err) {
            logger.error(
                `Error during adding a follower to the interest: ${
                    err as string
                }`
            );
        }
    }

    public static async removeFollowerFromInterest(
        databaseInstance: DataSource,
        uuid: string,
        followerUUID: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let interest: MySQLInterest | MongoDBInterest | null;
            let follower;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Removing a follower from the interest in the database...'
                );

                interest = await databaseInstance
                    .getRepository(MySQLInterest)
                    .findOneBy({ uuid: uuid });

                follower = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: followerUUID });

                if (interest && follower) {
                    interest.followers = interest.followers.filter(
                        (follower) => {
                            return follower !== followerUUID;
                        }
                    );

                    const interestUUID = interest.uuid;

                    follower.followedInterests =
                            follower.followedInterests.filter(
                                (followedInterest) => {
                                    return followedInterest !== interestUUID;
                                }
                            );

                    await databaseInstance
                        .getRepository(MySQLUser)
                        .save(follower);

                    await databaseInstance
                        .getRepository(MySQLInterest)
                        .save(interest);

                    return true;
                } else {
                    return false;
                }
            case 'mongodb':
                logger.info(
                    'Removing a follower from the interest in the database...'
                );

                interest = await databaseInstance
                    .getRepository(MongoDBInterest)
                    .findOneBy({ uuid: uuid });

                follower = await databaseInstance
                    .getRepository(MongoDBUser)
                    .findOneBy({ uuid: followerUUID });

                if (interest && follower) {
                    interest.followers = interest.followers.filter(
                        (follower) => {
                            return follower !== followerUUID;
                        }
                    );

                    const interestUUID = interest.uuid;

                    follower.followedInterests =
                            follower.followedInterests.filter(
                                (followedInterest) => {
                                    return followedInterest !== interestUUID;
                                }
                            );

                    await databaseInstance
                        .getRepository(MongoDBInterest)
                        .save(interest);

                    await databaseInstance
                        .getRepository(MongoDBUser)
                        .save(follower);

                    return true;
                } else {
                    return false;
                }
            }

            logger.log(
                'success',
                'Follower removed from the interest successfully'
            );
        } catch (err) {
            logger.error(
                `Error during removing a follower from the interest: ${
                    err as string
                }`
            );
        }
    }

    public static async fetchInterestFollowers(
        databaseInstance: DataSource,
        uuid: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let interest: MySQLInterest | MongoDBInterest | null;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Fetching followers of the interest from the database...'
                );

                interest = await databaseInstance
                    .getRepository(MySQLInterest)
                    .findOneBy({ uuid: uuid });

                if (interest) {
                    return interest;
                } else {
                    return false;
                }
            case 'mongodb':
                logger.info(
                    'Fetching followers of the interest from the database...'
                );

                interest = await databaseInstance
                    .getRepository(MongoDBInterest)
                    .findOneBy({ uuid: uuid });

                if (interest) {
                    return interest;
                } else {
                    return false;
                }
            }
        } catch (err) {
            logger.error(
                `Error during fetching followers of the interest: ${
                    err as string
                }`
            );
            return [];
        }
    }

    public static async addFollowerToUser(
        databaseInstance: DataSource,
        uuid: string,
        targetUUID: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let user;
            let target;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Adding a follower to the interest in the database...'
                );

                user = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: uuid });

                target = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: targetUUID });

                if (user && target) {
                    if (!user.followers.includes(targetUUID)) {
                        user.followers.push(targetUUID);
                        target.following.push(uuid);

                        user.followersCount = user.followersCount + 1;
                        target.followingCount = target.followingCount + 1;

                        await databaseInstance
                            .getRepository(MySQLUser)
                            .save(user);

                        await databaseInstance
                            .getRepository(MySQLUser)
                            .save(target);

                        logger.log(
                            'success',
                            `Follower ${targetUUID} has been added to User ${uuid} based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return true;
                    } else {
                        logger.error(
                            `Failed to add follower to the interest based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return false;
                    }
                }
                break;
            case 'mongodb':
                user = await databaseInstance
                    .getRepository(MongoDBUser)
                    .findOneBy({ uuid: uuid });

                target = await databaseInstance
                    .getRepository(MongoDBUser)
                    .findOneBy({ uuid: targetUUID });

                if (user && target) {
                    if (!user.followers.includes(targetUUID)) {
                        user.followers.push(targetUUID);
                        target.following.push(uuid);

                        user.followersCount = user.followersCount + 1;
                        target.followingCount = target.followingCount + 1;

                        await databaseInstance
                            .getRepository(MongoDBUser)
                            .save(user);

                        await databaseInstance
                            .getRepository(MongoDBUser)
                            .save(target);

                        logger.log(
                            'success',
                            `Follower ${targetUUID} has been add to User ${uuid} based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return true;
                    } else {
                        logger.error(
                            `Failed to add follower to the interest based on: ${JSON.stringify(
                                { uuid: uuid }
                            )}`
                        );

                        return false;
                    }
                }
                break;
            }
        } catch (err) {
            logger.error(
                `Error during adding a follower to the interest: ${
                    err as string
                }`
            );
        }
    }

    public static async removeFollowerFromUser(
        databaseInstance: DataSource,
        uuid: string,
        targetUUID: string,
        dbType?: SupportedDatabaseType
    ) {
        try {
            const databaseType =
                dbType ?? config.databases[currentDatabase].type;

            let user;
            let target;

            switch (databaseType) {
            case 'mysql':
            case 'mariadb':
            case 'mssql':
            case 'postgres':
            case 'cockroachdb':
            case 'sqlite':
            case 'better-sqlite3':
            case 'capacitor':
            case 'cordova':
            case 'react-native':
            case 'nativescript':
                logger.info(
                    'Adding a follower to the interest in the database...'
                );

                user = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: uuid });

                target = await databaseInstance
                    .getRepository(MySQLUser)
                    .findOneBy({ uuid: targetUUID });

                if (user && target) {
                    user.followers = user.followers.filter((user) => {
                        return user !== targetUUID;
                    });

                    target.following = target.following.filter((target) => {
                        return target !== uuid;
                    });

                    user.followersCount = user.followersCount - 1;
                    target.followingCount = target.followingCount - 1;

                    await databaseInstance
                        .getRepository(MySQLUser)
                        .save(user);

                    await databaseInstance
                        .getRepository(MySQLUser)
                        .save(target);

                    logger.log(
                        'success',
                        `Follower ${targetUUID} has been removed from User ${uuid} based on: ${JSON.stringify(
                            { uuid: uuid }
                        )}`
                    );

                    return true;
                } else {
                    logger.error(
                        `Failed to add follower to the user based on: ${JSON.stringify(
                            {
                                uuid: uuid
                            }
                        )}`
                    );

                    return false;
                }
            case 'mongodb':
                user = await databaseInstance
                    .getRepository(MongoDBUser)
                    .findOneBy({ uuid: uuid });

                target = await databaseInstance
                    .getRepository(MongoDBUser)
                    .findOneBy({ uuid: targetUUID });

                if (user && target) {
                    user.followers = user.followers.filter((user) => {
                        return user !== targetUUID;
                    });

                    target.following = target.following.filter((target) => {
                        return target !== uuid;
                    });

                    user.followersCount = user.followersCount - 1;
                    target.followingCount = target.followingCount - 1;

                    await databaseInstance
                        .getRepository(MongoDBUser)
                        .save(user);

                    await databaseInstance
                        .getRepository(MongoDBUser)
                        .save(target);

                    logger.log(
                        'success',
                        `Follower ${targetUUID} has been removed from User ${uuid} based on: ${JSON.stringify(
                            { uuid: uuid }
                        )}`
                    );

                    return true;
                } else {
                    logger.error(
                        `Failed to add follower to the user based on: ${JSON.stringify(
                            {
                                uuid: uuid
                            }
                        )}`
                    );

                    return false;
                }
            }
        } catch (err) {
            logger.error(
                `Error during adding a follower to the interest: ${
                    err as string
                }`
            );
        }
    }
}

export { masterInstance, currentDatabase };
