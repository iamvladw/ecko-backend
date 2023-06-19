interface wss {
    public: {
        currentBranch?: string;
        currentCommit?: string;
        currentVersion?: string;
        githubVersion?: string;
        cpuUsage?: string;
        memUsage?: string;
        requests?: string;
        responses?: string;
    };
}

export { wss };
