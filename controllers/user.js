import { loginSchema, registerSchema } from "../config/zod.js";
import { redisClient } from "../server.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
import sendMail from "../config/sendMail.js";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../config/generateToken.js";
import { generateCSRFToken } from "../config/csrfMiddleware.js";

export const registerUser = TryCatch(async (req, res) => {
    const senitizedBody = sanitize(req.body);
    const validation = registerSchema.safeParse(senitizedBody);

    if (!validation.success) {
        const zodError = validation.error;
        let firstErrorMessage = 'validation failed';
        let allErrors = [];

        if (zodError?.issues && Array.isArray(zodError.issues)) {
            allErrors = zodError.issues.map((issue) => ({
                field: issue.path ? issue.path.join('.') : 'unknown',
                message: issue.message || "validation error",
                code: issue.code
            }));

            firstErrorMessage = allErrors[0]?.message || "validation error";
        }

        return res.status(400).json({
            error: allErrors,
            message: firstErrorMessage,
        });
    }

    const { name, email, password } = validation.data;

    const reteLimitKey = `register-rate-limit-${req.ip}: ${email}`;

    if (await redisClient.get(reteLimitKey)) {
        return res.status(429).json({
            message: "Too many requests. Please try again later."
        });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            message: "User with this email already exists."
        });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(32).toString("hex");

    const verifyKey = `verify:${verifyToken}`;

    const dataToStore = JSON.stringify({
        name,
        email,
        password: hashPassword,
    });

    await redisClient.set(verifyKey, dataToStore, { EX: 300 });

    const subject = "Verify your email address for TLBR.io account creation";

    const html = getVerifyEmailHtml({ email, token: verifyToken });

    await sendMail(email, subject, html);

    await redisClient.set(reteLimitKey, "true", { EX: 60 });

    res.json({
        message: "If your email is valid, a verification link has been sent to your email address. It will expire in 5 minutes."
    })
});


export const verifyUser = TryCatch(async (req, res) => {
    const { token } = req.params;
    if (!token) {
        return res.status(400).json({ message: "Verification Token is required" });
    }

    const verifyKey = `verify:${token}`;

    const userDataJson = await redisClient.get(verifyKey);
    if (!userDataJson) {
        return res.status(400).json({ message: "Verification Link is expired" });
    }

    await redisClient.del(verifyKey);

    const userData = JSON.parse(userDataJson);

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        return res.status(409).json({
            message: "User with this email already exists."
        });
    }

    const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
    });

    await newUser.save();

    res.status(201).json({
        message: "Email verified successfully. Your account has been created.",
        user: { _id: newUser._id, name: newUser.name, email: newUser.email },
    });
});


export const loginUser = TryCatch(async (req, res) => {
    const senitizedBody = sanitize(req.body);
    const validation = loginSchema.safeParse(senitizedBody);

    if (!validation.success) {
        const zodError = validation.error;
        let firstErrorMessage = 'validation failed';
        let allErrors = [];

        if (zodError?.issues && Array.isArray(zodError.issues)) {
            allErrors = zodError.issues.map((issue) => ({
                field: issue.path ? issue.path.join('.') : 'unknown',
                message: issue.message || "validation error",
                code: issue.code
            }));

            firstErrorMessage = allErrors[0]?.message || "validation error";
        }

        return res.status(400).json({
            error: allErrors,
            message: firstErrorMessage,
        });
    }

    const { email, password } = validation.data;

    const rateLimitKey = `login-rate-limit-${req.ip}:${email}`;

    if (await redisClient.get(rateLimitKey)) {
        return res.status(429).json({
            message: "Too many requests. Please try again later."
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `otp:${normalizedEmail}`;

    await redisClient.set(otpKey, otp, { EX: 300 });

    const subject = "Your OTP for TLBR.io login";

    const html = getOtpHtml({ email, otp });

    await sendMail(email, subject, html);

    await redisClient.set(rateLimitKey, "true", { EX: 60 });

    res.json({
        message: "If your email is valid, an OTP has been sent to your email address. It will expire in 5 minutes."
    });
});

export const verifyOtp = TryCatch(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const otpKey = `otp:${normalizedEmail}`;

    const storedOtpString = await redisClient.get(otpKey);
    if (!storedOtpString) {
        return res.status(400).json({ message: "OTP Expired" });
    }

    const storedOtp = storedOtpString.toString();

    if (storedOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    await redisClient.del(otpKey);

    let user = await User.findOne({ email });

    const tokenData = await generateToken(user._id, res);

    res.status(200).json({
        message: `Welcome, ${user.name}`,
        user,
        sessionInfo: {
            sessionId: tokenData.sessionId,
            loginTime: new Date().toISOString(),
            csrfToken: tokenData.csrfToken,
        }
    });
});

export const myProfile = TryCatch(async (req, res) => {
    const user = req.user;
    const sessionId = req.sessionId;
    const sessionData = await redisClient.get(`session:${sessionId}`);
    let sessionInfo = null;
    if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        sessionInfo = {
            loginTime: parsedSession.createdAt,
            lastActivity: parsedSession.lastActivity,
        }
    }
    res.status(200).json({ user, sessionInfo });
});

export const refreshToken = TryCatch(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('csrfToken');
        return res.status(401).json({ message: "Session expired. Please login" });
    }

    generateAccessToken(decoded.id, decoded.sessionId, res);

    res.status(200).json({ message: "Access token refreshed successfully" });
});

export const logoutUser = TryCatch(async (req, res) => {
    const userId = req.user._id;
    await revokeRefreshToken(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('csrfToken');

    await redisClient.del(`user:${userId}`);

    res.status(200).json({ message: "Logged out successfully" });
});

export const refreshCSRF = TryCatch(async (req, res) => {
    const userId = req.user._id;

    const newCSRFToken = await generateCSRFToken(userId, res);

    res.status(200).json({ message: "CSRF token refreshed successfully", csrfToken: newCSRFToken });
});


export const adminController = TryCatch(async (req, res) => {
    res.status(200).json({ message: "Welcome to the admin panel" });
});