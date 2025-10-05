import express from 'express';
import eventRoutes from '../features/events/event.route.js';


const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Everty API!' });
});

// TODO: Add feature routes here later
router.use('/events', eventRoutes);     // Mount all event-related endpoints
// import authRoutes from '../features/auth/auth.route.js';
// router.use('/auth', authRoutes);

export default router;