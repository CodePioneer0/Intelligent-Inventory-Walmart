import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { authRoutes } from './routes/authRoutes';
import { productRoutes } from './routes/productRoutes';
import { inventoryRoutes } from './routes/inventoryRoutes';
import { forecastingRoutes } from './routes/forecastingRoutes';
import { analyticsRoutes } from './routes/analyticsRoutes';
import { aiRoutes } from './routes/aiRoutes';

import { SocketHandler } from './websocket/socketHandler';
import { AIScheduler } from './services/aiScheduler';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(limiter);

// Initialize WebSocket handler
const socketHandler = new SocketHandler(io);

// Initialize AI Scheduler
const aiScheduler = new AIScheduler(socketHandler);
aiScheduler.start();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/forecasting', authenticateToken, forecastingRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 AI services initialized`);
});

export { app, io };