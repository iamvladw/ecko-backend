interface JSONData {
    lastDatabaseLoaded: string;
    server: {
        serverName: string;
        uuid: string;
        location: string;
        secret: string;
        secretPhrase: string;
        apiKey: string;
    };
}

export { JSONData };
