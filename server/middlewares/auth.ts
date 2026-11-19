import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

export interface AuthRequest extends Request {
    user?: IUser;
        
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction)
:Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
             //verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

            //Get user from the token, excluding the password
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }
            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }  
    } 
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, admin only' });
    }
};

export const OwnerOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, restaurant owner only' });
    }
};

