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
    group: string;
    followers: string[];
}

export { InterestGroup, Interest };
