import { Request } from 'express';
import User from './user.interface';

interface AuthenticatedRequest extends Request {
    user?: User;
}

export default AuthenticatedRequest;
