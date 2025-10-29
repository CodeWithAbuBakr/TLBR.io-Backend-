import express from 'express';
import {loginUser, logoutUser, myProfile, refreshToken, registerUser, verifyOtp, verifyUser} from '../controllers/user.js';
import { isAuth } from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify/otp", verifyOtp);
router.get("/refresh/token", refreshToken);
router.get("/logout", isAuth, logoutUser);

export default router;