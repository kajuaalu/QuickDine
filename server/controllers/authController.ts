// register a new user
// POST /api/auth/register'

import { Request, Response } from 'express';
import User, { IUser } from '../models/User.js';
// @ts-ignore -- runtime dependency; install bcryptjs to use this controller.
import bcrypt from 'bcryptjs';
// @ts-ignore -- runtime dependency; install jsonwebtoken to use this controller.
import jwt from 'jsonwebtoken';
import {AuthRequest} from '../middlewares/auth.js';

//helper function to generate JWT token
const generateToken = (id: string): string => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET as string, //process.env.JWT_SECRET is expected to be a string, but it can be undefined if not set. The 'as string' assertion tells TypeScript to treat it as a string, but you should ensure that the environment variable is set correctly in your deployment environment.
        { expiresIn: '30d' }
    );
};//"Take a user's ID, create a signed JWT using my secret key, and make it expire after 30 days."


//aync means that the function will return a promise, and you can use await inside it to wait for asynchronous operations to complete. 
// The Promise<void> return type indicates that this function does not return any value when it resolves.
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        //object destructuring to extract the name, email, password, phone, and role properties from the req.body object.
        //  This is a common pattern in JavaScript and TypeScript to make it easier to work with objects.
        const { name, email, password, phone, role } = req.body; //request body is expected to contain these properties when a user is registering.

        // Check if user already exists
        const existingUser: IUser | null = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' }); 
            return;
        }

        const salt = await bcrypt.genSalt(10);//generate a salt for hashing the password. The number 10 is the cost factor, which determines how computationally expensive the hashing process will be. A higher number means more security but also more processing time.
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
        });//create a new user in the database with the provided name, email, hashed password, phone, and role. The User.create method is an asynchronous operation that returns a promise resolving to the newly created user document.

        if (user) {//if the user was successfully created, send a response with status code 201 (Created) and a JSON object containing the user's details and a JWT token.
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id.toString())
            })
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error : any) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });//status code 500 indicates that there was an internal server error, and the message 'Server error' is sent back to the client. This is a generic error message that doesn't expose any sensitive information about the server or the database.
    }
}

//authenticate a user and get token
// POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.status(400).json({ message: 'Please provide email and password' });
            return;
        }

        //check for user
        const user = await User.findOne({ email });
        if(!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password as string);//bcrypt.compare takes the plain text password provided by the user and the hashed password stored in the database, and checks if they match. It returns a boolean value indicating whether the passwords are the same.
        if(!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id.toString())
            })
        
    } catch (error : any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

//get user profile
// GET /api/auth/me
//@access Private
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
       if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        res.json(req.user);
    } catch (error : any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};