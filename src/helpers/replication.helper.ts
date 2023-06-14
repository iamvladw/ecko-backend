import { DataSource } from 'typeorm';
import config from './config.helper';
import { SupportedDatabaseType } from '../interfaces/config.interface';
import logger from '../helpers/winston.helper';
import User from '../interfaces/user.interface';
import {
    currentDatabase,
    masterInstance,
    helperDatabase
} from './database.helper';
import { MySQLUser, MongoDBUser } from '../database/entities/user.entity';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { CordovaConnectionOptions } from 'typeorm/driver/cordova/CordovaConnectionOptions';
import { Interest, InterestGroup } from '../interfaces/interest.interface';
import {
    MongoDBInterest,
    MongoDBInterestGroup,
    MySQLInterest,
    MySQLInterestGroup
} from '../database/entities/interests.entity';

export class helperReplication {
    public static async performReplication() {
        if (config.replication) {
            const currentDB = config.databases[currentDatabase];
            const backupDatabases = helperDatabase.fetchDatabaseByRole(
                'backup',
                true
            ) as string[];
            const replicatedDataBases: string[] = [];
            const replicatedSyncDataBases: string[] = [];

            if (backupDatabases.length === 0) {
                return logger.warn(
                    'The server wan\'t able to fetch any backup database.'
                );
            }

            logger.info(
                `Attempting database replication for ${String(backupDatabases)}`
            );
            logger.info(
                `Attempting database synchronization for ${String(
                    backupDatabases
                )}`
            );

            try {
                let masterUsers: (MySQLUser | MongoDBUser)[];
                let masterInterestsGroup: (
                    | MySQLInterestGroup
                    | MongoDBInterestGroup
                )[];
                let masterInterests: (MySQLInterest | MongoDBInterest)[];

                switch (currentDB.type) {
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
                    masterUsers = await masterInstance
                        .getRepository(MySQLUser)
                        .find();
                    masterInterestsGroup = await masterInstance
                        .getRepository(MySQLInterestGroup)
                        .find();
                    masterInterests = await masterInstance
                        .getRepository(MySQLInterest)
                        .find();
                    break;
                case 'mongodb':
                    masterUsers = await masterInstance
                        .getRepository(MongoDBUser)
                        .find();
                    masterInterestsGroup = await masterInstance
                        .getRepository(MongoDBInterestGroup)
                        .find();
                    masterInterests = await masterInstance
                        .getRepository(MongoDBInterest)
                        .find();
                    break;
                }

                for (const backupName of backupDatabases) {
                    try {
                        const backupDB = config.databases[backupName];
                        let backupInstance: DataSource;

                        switch (backupDB.type) {
                        case 'mysql':
                        case 'mariadb':
                        case 'mongodb':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                url: backupDB.url,
                                charset: backupDB.charset,
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations
                            });
                            break;
                        case 'mssql':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                url: backupDB.url,
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations,
                                options: backupDB.options
                            });
                            break;
                        case 'postgres':
                        case 'cockroachdb':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                url: backupDB.url,
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations
                            } as PostgresConnectionOptions);
                            break;
                        case 'sqlite':
                        case 'better-sqlite3':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                database:
                                        backupDB.database ?? 'database-ecko.db',
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations
                            });
                            break;
                        case 'capacitor':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                database:
                                        backupDB.database ?? 'database-ecko.db',
                                driver: backupDB.driver,
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations
                            });
                            break;
                        case 'cordova':
                        case 'react-native':
                        case 'nativescript':
                            backupInstance = new DataSource({
                                type: backupDB.type,
                                database:
                                        backupDB.database ?? 'database-ecko.db',
                                driver: backupDB.driver,
                                location: backupDB.driver,
                                synchronize: backupDB.synchronize,
                                logging: backupDB.logging,
                                entities:
                                        helperDatabase.fetchEntitiesByType(
                                            backupDB.type
                                        ),
                                migrations: backupDB.migrations
                            } as CordovaConnectionOptions);
                            break;
                        }

                        await backupInstance.initialize();

                        if (backupDB.synchronize) {
                            try {
                                await backupInstance.synchronize();

                                replicatedSyncDataBases.push(backupName);
                            } catch (err) {
                                logger.error(
                                    `Error during synchronization of the database: ${backupName}`
                                );
                                logger.error(`${err as string}`);
                            }
                        }

                        let backupUsers: (MySQLUser | MongoDBUser)[];
                        let backupInterestsGroup: (
                            | MySQLInterestGroup
                            | MongoDBInterestGroup
                        )[];
                        let backupInterests: (
                            | MySQLInterest
                            | MongoDBInterest
                        )[];

                        switch (backupDB.type) {
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
                            backupUsers = await backupInstance
                                .getRepository(MySQLUser)
                                .find();
                            backupInterestsGroup = await backupInstance
                                .getRepository(MySQLInterestGroup)
                                .find();
                            backupInterests = await backupInstance
                                .getRepository(MySQLInterest)
                                .find();
                            break;
                        case 'mongodb':
                            backupUsers = await backupInstance
                                .getRepository(MongoDBUser)
                                .find();
                            backupInterestsGroup = await backupInstance
                                .getRepository(MongoDBInterestGroup)
                                .find();
                            backupInterests = await backupInstance
                                .getRepository(MongoDBInterest)
                                .find();
                            break;
                        }

                        // Users

                        for (const masterUser of masterUsers) {
                            const matchingBackupUser = backupUsers.find(
                                (backupUser) => {
                                    return backupUser.uuid === masterUser.uuid;
                                }
                            );

                            const user = this.mapUserFields(
                                masterUser,
                                backupDB.type
                            );

                            if (!matchingBackupUser) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLUser)
                                        .save(user);
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBUser)
                                        .save(user);
                                    break;
                                }
                            }
                        }

                        for (const backupUser of backupUsers) {
                            const masterUser = masterUsers.find(
                                (masterUser) => {
                                    return masterUser.uuid === backupUser.uuid;
                                }
                            );

                            if (masterUser) {
                                const unpackedBackupUser =
                                    helperReplication.unpackUserFields(
                                        backupUser
                                    ) as Record<string, unknown>;
                                const unpackedMasterUser =
                                    helperReplication.unpackUserFields(
                                        masterUser
                                    ) as Record<string, unknown>;

                                const fieldsToUpdate: Record<string, unknown> =
                                    {};

                                for (const field in unpackedBackupUser) {
                                    if (field in unpackedBackupUser) {
                                        const backupUserFieldValue =
                                            unpackedBackupUser[field];
                                        const masterUserFieldValue =
                                            unpackedMasterUser[field];

                                        if (
                                            masterUserFieldValue !==
                                            backupUserFieldValue
                                        ) {
                                            fieldsToUpdate[field] =
                                                masterUserFieldValue;

                                            switch (backupDB.type) {
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
                                                await backupInstance
                                                    .getRepository(
                                                        MySQLUser
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupUser.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            case 'mongodb':
                                                await backupInstance
                                                    .getRepository(
                                                        MongoDBUser
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupUser.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        for (const backupUser of backupUsers) {
                            const matchingMasterUser = masterUsers.find(
                                (masterUser) => {
                                    return masterUser.uuid === backupUser.uuid;
                                }
                            );

                            if (!matchingMasterUser) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLUser)
                                        .delete({
                                            uuid: backupUser.uuid
                                        });
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBUser)
                                        .delete({
                                            uuid: backupUser.uuid
                                        });
                                    break;
                                }
                            }
                        }

                        // Interests Group

                        for (const masterInterestGroup of masterInterestsGroup) {
                            const matchingBackupInterestGroup =
                                backupInterestsGroup.find(
                                    (backupInterestGroup) => {
                                        return (
                                            backupInterestGroup.uuid ===
                                            masterInterestGroup.uuid
                                        );
                                    }
                                );

                            const InterestGroup = this.mapInterestGroupFields(
                                masterInterestGroup,
                                backupDB.type
                            );

                            if (!matchingBackupInterestGroup) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLInterestGroup)
                                        .save(InterestGroup);
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBInterestGroup)
                                        .save(InterestGroup);
                                    break;
                                }
                            }
                        }

                        for (const backupInterestGroup of backupInterestsGroup) {
                            const masterInterestGroup =
                                masterInterestsGroup.find(
                                    (masterInterestGroup) => {
                                        return (
                                            masterInterestGroup.uuid ===
                                            backupInterestGroup.uuid
                                        );
                                    }
                                );

                            if (masterInterestGroup) {
                                const unpackedBackupInterestGroup =
                                    helperReplication.unpackInterestGroupFields(
                                        backupInterestGroup
                                    ) as Record<string, unknown>;
                                const unpackedMasterInterestGroup =
                                    helperReplication.unpackInterestGroupFields(
                                        masterInterestGroup
                                    ) as Record<string, unknown>;

                                const fieldsToUpdate: Record<string, unknown> =
                                    {};

                                for (const field in unpackedBackupInterestGroup) {
                                    if (field in unpackedBackupInterestGroup) {
                                        const backupInterestGroupFieldValue =
                                            unpackedBackupInterestGroup[field];
                                        const masterInterestGroupFieldValue =
                                            unpackedMasterInterestGroup[field];

                                        if (
                                            masterInterestGroupFieldValue !==
                                            backupInterestGroupFieldValue
                                        ) {
                                            fieldsToUpdate[field] =
                                                masterInterestGroupFieldValue;

                                            switch (backupDB.type) {
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
                                                await backupInstance
                                                    .getRepository(
                                                        MySQLInterestGroup
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupInterestGroup.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            case 'mongodb':
                                                await backupInstance
                                                    .getRepository(
                                                        MongoDBInterestGroup
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupInterestGroup.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        for (const backupInterestGroup of backupInterestsGroup) {
                            const matchingMasterInterestGroup =
                                masterInterestsGroup.find(
                                    (masterInterestGroup) => {
                                        return (
                                            masterInterestGroup.uuid ===
                                            backupInterestGroup.uuid
                                        );
                                    }
                                );

                            if (!matchingMasterInterestGroup) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLInterestGroup)
                                        .delete({
                                            uuid: backupInterestGroup.uuid
                                        });
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBInterestGroup)
                                        .delete({
                                            uuid: backupInterestGroup.uuid
                                        });
                                    break;
                                }
                            }
                        }

                        // Interests

                        for (const masterInterest of masterInterests) {
                            const matchingBackupInterest = backupInterests.find(
                                (backupInterest) => {
                                    return (
                                        backupInterest.uuid ===
                                        masterInterest.uuid
                                    );
                                }
                            );

                            const Interest = this.mapInterestFields(
                                masterInterest,
                                backupDB.type
                            );

                            if (!matchingBackupInterest) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLInterest)
                                        .save(Interest);
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBInterest)
                                        .save(Interest);
                                    break;
                                }
                            }
                        }

                        for (const backupInterest of backupInterests) {
                            const masterInterest = masterInterests.find(
                                (masterInterest) => {
                                    return (
                                        masterInterest.uuid ===
                                        backupInterest.uuid
                                    );
                                }
                            );

                            if (masterInterest) {
                                const unpackedBackupInterest =
                                    helperReplication.unpackInterestFields(
                                        backupInterest
                                    ) as Record<string, unknown>;
                                const unpackedMasterInterest =
                                    helperReplication.unpackInterestFields(
                                        masterInterest
                                    ) as Record<string, unknown>;

                                const fieldsToUpdate: Record<string, unknown> =
                                    {};

                                for (const field in unpackedBackupInterest) {
                                    if (field in unpackedBackupInterest) {
                                        const backupInterestFieldValue =
                                            unpackedBackupInterest[field];
                                        const masterInterestFieldValue =
                                            unpackedMasterInterest[field];

                                        if (
                                            masterInterestFieldValue !==
                                            backupInterestFieldValue
                                        ) {
                                            fieldsToUpdate[field] =
                                                masterInterestFieldValue;

                                            switch (backupDB.type) {
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
                                                await backupInstance
                                                    .getRepository(
                                                        MySQLInterest
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupInterest.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            case 'mongodb':
                                                await backupInstance
                                                    .getRepository(
                                                        MongoDBInterest
                                                    )
                                                    .update(
                                                        {
                                                            uuid: backupInterest.uuid
                                                        },
                                                        fieldsToUpdate
                                                    );
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        for (const backupInterest of backupInterests) {
                            const matchingMasterInterest = masterInterests.find(
                                (masterInterest) => {
                                    return (
                                        masterInterest.uuid ===
                                        backupInterest.uuid
                                    );
                                }
                            );

                            if (!matchingMasterInterest) {
                                switch (backupDB.type) {
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
                                    await backupInstance
                                        .getRepository(MySQLInterest)
                                        .delete({
                                            uuid: backupInterest.uuid
                                        });
                                    break;
                                case 'mongodb':
                                    await backupInstance
                                        .getRepository(MongoDBInterest)
                                        .delete({
                                            uuid: backupInterest.uuid
                                        });
                                    break;
                                }
                            }
                        }

                        replicatedDataBases.push(backupName);
                    } catch (err) {
                        if (config.debug) {
                            logger.error(
                                `Error during replication of the database: ${backupName}`
                            );
                            logger.error(`${String(err)}`);
                        }
                    }
                }

                if (replicatedSyncDataBases.length > 0) {
                    logger.log(
                        'success',
                        `Synchronization completed successfully for ${String(
                            replicatedSyncDataBases
                        )}`
                    );
                }

                if (replicatedDataBases.length > 0) {
                    logger.log(
                        'success',
                        `Replication completed successfully for ${String(
                            replicatedDataBases
                        )}`
                    );
                }
            } catch (err) {
                logger.error('Error during replication:', err);
            }
        }
    }

    public static mapUserFields(
        masterUser: MySQLUser | MongoDBUser | User,
        type: SupportedDatabaseType
    ) {
        let user: MySQLUser | MongoDBUser | null;
        switch (type) {
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
            user = new MySQLUser();

            if ('_id' in masterUser) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { _id, ...userFields } = masterUser;
                Object.assign(user, userFields);
                return user;
            } else {
                Object.assign(user, masterUser);
                return user;
            }
        case 'mongodb':
            user = new MongoDBUser();

            if ('id' in masterUser) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { id, ...userFields } = masterUser;
                Object.assign(user, userFields);
                return user;
            } else {
                Object.assign(user, masterUser);
                return user;
            }
        }
    }

    public static mapInterestGroupFields(
        interestGroup:
            | MySQLInterestGroup
            | MongoDBInterestGroup
            | InterestGroup,
        type: SupportedDatabaseType
    ) {
        let mappedInterestGroup:
            | MySQLInterestGroup
            | MongoDBInterestGroup
            | InterestGroup;
        switch (type) {
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
            mappedInterestGroup = new MySQLInterestGroup();

            if ('_id' in interestGroup) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { _id, ...interestGroupFields } = interestGroup;
                Object.assign(mappedInterestGroup, interestGroupFields);
                return mappedInterestGroup;
            } else {
                Object.assign(mappedInterestGroup, interestGroup);
                return mappedInterestGroup;
            }
        case 'mongodb':
            mappedInterestGroup = new MongoDBInterestGroup();

            if ('id' in interestGroup) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { id, ...interestGroupFields } = interestGroup;
                Object.assign(mappedInterestGroup, interestGroupFields);
                return mappedInterestGroup;
            } else {
                Object.assign(mappedInterestGroup, interestGroup);
                return mappedInterestGroup;
            }
        }
    }

    public static mapInterestFields(
        Interest: MySQLInterest | MongoDBInterest | Interest,
        type: SupportedDatabaseType
    ) {
        let mappedInterest: MySQLInterest | MongoDBInterest | Interest;
        switch (type) {
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
            mappedInterest = new MySQLInterest();

            if ('_id' in Interest) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { _id, ...interestFields } = Interest;
                Object.assign(mappedInterest, interestFields);
                return mappedInterest;
            } else {
                Object.assign(mappedInterest, Interest);
                return mappedInterest;
            }
        case 'mongodb':
            mappedInterest = new MongoDBInterest();

            if ('id' in Interest) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const { id, ...interestFields } = Interest;
                Object.assign(mappedInterest, interestFields);
                return mappedInterest;
            } else {
                Object.assign(mappedInterest, Interest);
                return mappedInterest;
            }
        }
    }

    public static unpackUserFields(masterUser: MySQLUser | MongoDBUser) {
        let userFields;
        switch (masterUser.constructor) {
        case MySQLUser:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { id, ...userFields_sql } = masterUser as MySQLUser;
            userFields = userFields_sql;
            break;
        default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { _id, ...userFields_mongo } = masterUser as MongoDBUser;
            userFields = userFields_mongo;
        }
        return userFields;
    }

    public static unpackInterestGroupFields(
        masterInterestGroup: MySQLInterestGroup | MongoDBInterestGroup
    ) {
        let userFields;
        switch (masterInterestGroup.constructor) {
        case MySQLInterestGroup:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { id, ...userFields_sql } =
                    masterInterestGroup as MySQLInterestGroup;
            userFields = userFields_sql;
            break;
        default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { _id, ...userFields_mongo } =
                    masterInterestGroup as MongoDBInterestGroup;
            userFields = userFields_mongo;
        }
        return userFields;
    }

    public static unpackInterestFields(
        masterInterest: MySQLInterest | MongoDBInterest
    ) {
        let userFields;
        switch (masterInterest.constructor) {
        case MySQLInterest:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { id, ...userFields_sql } =
                    masterInterest as MySQLInterest;
            userFields = userFields_sql;
            break;
        default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-case-declarations, no-unused-vars
            const { _id, ...userFields_mongo } =
                    masterInterest as MongoDBInterest;
            userFields = userFields_mongo;
        }
        return userFields;
    }
}
