interface InterestGroup {
    uuid: string;
    name: string;
    description: string;
    interests: string[];
}

interface Interest {
    uuid: string;
    name: string;
    description: string;
    followers: string[];
    group: string;
}

export { InterestGroup, Interest };
