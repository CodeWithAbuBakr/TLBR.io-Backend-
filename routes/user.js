import express from 'express';
import { adminController, deleteUser, getAllUsers, loginUser, logoutUser, myProfile, refreshCSRF, refreshToken, registerUser, verifyOtp, verifyUser } from '../controllers/user.js';
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

// Admin Routes
router.get("/admin", isAuth, authorizedAdmin, adminController);
router.get("/admin/users", isAuth, authorizedAdmin, getAllUsers);
router.delete("/admin/users/:id", isAuth, authorizedAdmin, deleteUser);

export default router;