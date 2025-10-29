import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/user.js';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
await connectDB();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("REDIS_URL is not defined in environment variables");
    process.exit(1);
}

export const redisClient = createClient({
    url: redisUrl
});

redisClient.connect().then(() => {
    console.log("Connected to Redis");
}).catch((err) => {
    console.error("Could not connect to Redis", err);
});

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS configuration
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:5173',
        'http://192.168.1.5:5173',
        'http://localhost:3000',
        'http://192.168.1.5:3000',
        'http://localhost:3001',
        'http://192.168.1.5:3001',
    ]
}));

// Routes
app.use('/api/v1', userRoutes);
app.use('/test', (req, res) => {
    res.send("TLBR.io APIs are running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})

export default app;