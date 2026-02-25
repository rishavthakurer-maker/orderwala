import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import vendorRoutes from './routes/vendors';
import deliveryRoutes from './routes/delivery';
import paymentRoutes from './routes/payments';
import cartRoutes from './routes/cart';
import reviewRoutes from './routes/reviews';
import categoryRoutes from './routes/categories';
import promosRoutes from './routes/promos';
import mapsRoutes from './routes/maps';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============ MIDDLEWARE ============

// Security middleware
app.use(helmet());

// CORS settings
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// ============ ROUTES ============

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promos', promosRoutes);
app.use('/api/maps', mapsRoutes);

// Protected routes
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/cart', authMiddleware, cartRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/vendors', authMiddleware, vendorRoutes);
app.use('/api/delivery', authMiddleware, deliveryRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);

// ============ WEBSOCKET EVENTS ============

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Order tracking events
  socket.on('join_order', (orderId: string) => {
    socket.join(`order_${orderId}`);
  });

  socket.on('leave_order', (orderId: string) => {
    socket.leave(`order_${orderId}`);
  });

  // Delivery tracking events
  socket.on('join_delivery', (deliveryId: string) => {
    socket.join(`delivery_${deliveryId}`);
  });

  socket.on('delivery_location', (data: { deliveryId: string; lat: number; lng: number }) => {
    io.to(`delivery_${data.deliveryId}`).emit('delivery_location_updated', {
      latitude: data.lat,
      longitude: data.lng,
      timestamp: new Date(),
    });
  });

  // Notification events
  socket.on('join_notifications', (userId: string) => {
    socket.join(`notifications_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ============ ERROR HANDLING ============

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler);

// ============ SERVER STARTUP ============

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

export { app, io, httpServer };
