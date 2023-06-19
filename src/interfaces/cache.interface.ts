interface JSONData {
    server: {
        serverName: string;
        uuid: string;
        location: string;
        secret: string;
        secretPhrase: string;
        apiKey: string;
    };
    data: {
        lastDatabaseLoaded: string;
        numberOfRequests: number;
        numberOfResponses: number;
    };
}

export { JSONData };
