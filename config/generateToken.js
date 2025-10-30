import jwt from 'jsonwebtoken';
import { redisClient } from '../server.js';
import { generateCSRFToken, revokeCSRFToken } from './csrfMiddleware.js';
import crypto from 'crypto';

export const generateToken = async (id, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id, sessionId }, process.env.REFRESH_SECRET, {
        expiresIn: '7d',
    });

    const refreshTokenKey = `refresh_token:${id}`;
    const activeSessionKey = `active_session:${id}`;
    const sessionDatakey = `session:${sessionId}`;

    const existingSession = await redisClient.get(activeSessionKey);
    if (existingSession) {
        const existingSessionId = existingSession;
        await redisClient.del(`session:${existingSessionId}`);
        await redisClient.del(refreshToken);
    }

    const sessionData = {
        userId: id,
        sessionId,
        createdAt: new Date.toISOString(),
        lastActivity: new Date.toISOString(),

    };

    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);
    await redisClient.setEx(
        activeSessionKey,
        7 * 24 * 60 * 60,
        JSON.stringify(sessionData)
    );

    await redisClient.setEx(sessionDatakey, 7 * 24 * 60 * 60, sessionData);


    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // secure: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'none',
        // secure: true,
    });

    const csrfToken = await generateCSRFToken(id, res);

    return { accessToken, refreshToken, csrfToken, sessionId };
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        const decodedData = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        if (!decodedData) {
            throw new Error("Invalid refresh token");
        }
        const storedRefreshToken = await redisClient.get(`refresh_token:${decodedData.id}`);
        if (storedRefreshToken !== refreshToken) {
            return null;
        }

        const activeSessionId = await redisClient.get(`active_session:${decodedData.id}`);
        if (activeSessionId !== decodedData.sessionId) {
            return null;
        }

        const sessionData = await redisClient.get(`session:${decodedData.sessionId}`);
        if (!sessionData) {
            return null;
        }

        const parsedSessionData = JSON.parse(sessionData);
        parsedSessionData.lastActivity = new Date().toISOString();

        await redisClient.setEx(
            `session:${decodedData.sessionId}`,
            7 * 24 * 60 * 60,
            JSON.stringify(parsedSessionData)
        );

        return decodedData;
    } catch (error) {
        return null;
    }
}

export const generateAccessToken = (id, sessionId, res) => {
    const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // secure: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 15 * 60 * 1000,
    });
}

export const revokeRefreshToken = async (userId) => {
    const activeSessionId = await redisClient.get(`active_session:${userId}`);
    await redisClient.del(`refresh_token:${userId}`);
    await redisClient.del(`active_session:${activeSessionId}`);
    if(activeSessionId) {
        await redisClient.del(`session:${activeSessionId}`);
    }
    await revokeCSRFToken(userId);
}


export const isActiveSession = async (userId, sessionId) => {
    const activeSessionId = await redisClient.get(`active_session:${userId}`);
    return activeSessionId === sessionId;
}