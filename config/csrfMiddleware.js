import crypto from 'crypto';
import { redisClient } from '../server.js';

export const generateCSRFToken = async (userId, res) => {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const csrfKey = `csrf:${csrfToken}`;

    await redisClient.set(csrfKey, 3600, csrfToken);

    res.cookie('csrfToken', csrfToken, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000
    });
};

export const verifyCSRFToken = async (req, res, next) => {
    try {
        if (req.method === 'GET') {
            return next();
        }

        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const clientToken = req.cookies['x-csrf-token'] || req.headers['x-xsrf-token'] || req.headers['csrf-token'];
        if (!clientToken) {
            return res.status(403).json({
                message: 'CSRF token missing. Please refresh the page.',
                code: 'CSRF_TOKEN_MISSING'
            });
        }
        const csrfKey = `csrf:${clientToken}`;
        const storedToken = await redisClient.get(csrfKey);

        if (!storedToken) {
            return res.status(403).json({
                message: 'CSRF token Expired. Please try again.',
                code: 'CSRF_TOKEN_EXPIRED'
            });
        }
        if (storedToken !== clientToken) {
            return res.status(403).json({
                message: 'Invalid CSRF token. Please refresh the page.',
                code: 'CSRF_TOKEN_INVALID'
            });
        }
        next();
    } catch (error) {
        console.error('Error verifying CSRF token:', error);
        res.status(500).json({
            message: 'CSRF verification failed. Please try again later.',
            code: 'CSRF_VERIFICATION_ERROR'
        });
    }
};


export const revokeCSRFToken = async (userId) => {
    const csrfKey = `csrf:${userId}`;
    await redisClient.del(csrfKey);
}

export const refreshCSRFToken = async (userId, res) => {
    await revokeCSRFToken(userId);
    return await generateCSRFToken(userId, res);
}