import jwt from 'jsonwebtoken';
import { redisClient } from '../server.js';
import { User } from '../models/User.js';
import { isActiveSession } from '../config/generateToken.js';

export const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(403).json({ message: "Please login - no token" });
        }

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedData) {
            return res.status(400).json({ message: "Token expired" });
        }

        const sessionActive = await isActiveSession(decodedData.id, decodedData.sessionId);

        console.log("Session Active:", sessionActive);

        if (!sessionActive) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('csrfToken');

            return res.status(401).json({ message: "Session expired. You have been logged in from another device" });
         }

        const cacheUser = await redisClient.get(`user:${decodedData.id}`);

        if (cacheUser) {
            req.user = JSON.parse(cacheUser);
            req.sessionId = decodedData.sessionId;
            return next();
        }

        const user = await User.findById(decodedData.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await redisClient.set(`user:${decodedData.id}`, JSON.stringify(user), { EX: 3600 });

        req.user = user;
        req.sessionId = decodedData.sessionId;
        next();

    } catch (error) {
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
}


export const authorizedAdmin = (req, res, next) => {
    const user = req.user;

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "You are not allowed for this activity" });
    }

    next();
};
