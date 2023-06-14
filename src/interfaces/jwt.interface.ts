import User from './user.interface';

interface JwtPayload extends User {
    id: number;
    name: string;
}

export default JwtPayload;
