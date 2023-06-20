type SupportedDatabaseType =
    | 'mysql'
    | 'mariadb'
    | 'mssql'
    | 'mongodb'
    | 'postgres'
    | 'cockroachdb'
    | 'sqlite'
    | 'better-sqlite3'
    | 'capacitor'
    | 'cordova'
    | 'react-native'
    | 'nativescript';
type SupportedDatabaseRole = 'master' | 'backup';

interface SetupConfig {
    serverName: string;
    uuid: string;
    location: string;
    secret: string;
    secretPhrase: string;
    apiKey: string;
    ssl?: boolean;
}

interface DatabaseConfig {
    type: SupportedDatabaseType;
    url?: string;
    database?: string;
    driver?: 'no-encryption' | 'encryption' | 'secret' | 'newsecret';
    location?: string;
    charset?: string;
    role: SupportedDatabaseRole;
    enabled: boolean;
    synchronize: boolean;
    logging: boolean;
    entities: string[];
    migrations: string[];
    options?: Record<string, string>;
}

interface Config {
    dns: string;
    port: number;
    protocol: 'http' | 'https';
    ssl: {
        key: string;
        cert: string;
    };
    wss: {
        port: number;
        interval: number;
    };
    cloudflareProxy: boolean;
    apiAuthMethod: 'key' | 'ip' | 'both';
    staticPage: boolean,
    runAsRoot: boolean;
    logs: boolean;
    debug: boolean;
    replication: boolean;
    whitelist: string[];
    databases: Record<string, DatabaseConfig>;
    jwt: {
        expiresIn: string | number | undefined;
    };
}

export {
    Config,
    DatabaseConfig,
    SetupConfig,
    SupportedDatabaseType,
    SupportedDatabaseRole
};
