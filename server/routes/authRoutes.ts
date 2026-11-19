import {Router} from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/me', protect, getUserProfile);

export default authRouter;