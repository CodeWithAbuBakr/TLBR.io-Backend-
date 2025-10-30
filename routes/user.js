import express from 'express';
import { adminController, loginUser, logoutUser, myProfile, refreshCSRF, refreshToken, registerUser, verifyOtp, verifyUser } from '../controllers/user.js';
import { authorizedAdmin, isAuth } from '../middlewares/isAuth.js';
import { verifyCSRFToken } from '../config/csrfMiddleware.js';

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify/otp", verifyOtp);
router.get("/refresh/token", refreshToken);
router.get("/logout", isAuth, verifyCSRFToken, logoutUser);
router.post("/refresh/csrf", isAuth, refreshCSRF)
router.get("/admin", isAuth, authorizedAdmin, adminController);

export default router;