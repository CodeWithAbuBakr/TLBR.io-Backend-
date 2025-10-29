import jwt from 'jsonwebtoken';
import { redisClient } from '../server.js';

export const generateToken = async (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1m',
    });

    const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET, {
        expiresIn: '7d',
    });

    const refreshTokenKey = `refresh_token:${id}`;

    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // secure: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 1 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'none',
        // secure: true,
    });
    return { accessToken, refreshToken };
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        const decodedData = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        if (!decodedData) {
            throw new Error("Invalid refresh token");
        }
        const storedRefreshToken = await redisClient.get(`refresh_token:${decodedData.id}`);
        if (storedRefreshToken === refreshToken) {
            return decodedData;
        }

        return null;

    } catch (error) {
        return null;
    }
}

export const generateAccessToken = (id, res) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1m',
    });

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        // secure: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 1 * 60 * 1000,
    });
}

export const revokeRefreshToken = async (id) => {
    await redisClient.del(`refresh_token:${id}`);
}