import express from 'express';
import cors from 'cors';
import allRoutes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

// Global Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Mount all API routes from routes/index.js under the /api path
app.use('/api', allRoutes);

// Global Error Handler Middleware
app.use(errorMiddleware);

export default app;