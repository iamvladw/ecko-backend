interface User {
    uuid?: string;
    username: string;
    ekoTag?: string;
    email: string;
    password: string;
    description?: string;
    profilePicture?: string;
    bannerPicture?: string;
    location?: string;
    joinedDate: string;
    followedInterests: string[];
    followersCount?: number;
    followingCount?: number;
    followers: string[];
    following: string[];
}

export default User;
