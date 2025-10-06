import express from 'express';
import authRoutes from '../features/auth/auth.route.js';

const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Everty API!' });
});

// TODO: Add feature routes here later
// import authRoutes from '../features/auth/auth.route.js';
router.use('/auth', authRoutes);

export default router;