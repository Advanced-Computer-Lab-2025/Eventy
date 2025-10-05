import express from 'express';
<<<<<<< HEAD
// ...existing code...
import eventRoutes from '../features/events/event.route.js';
// ...existing code...
const PORT = process.env.PORT || 5000;
=======
import eventRoutes from '../features/events/event.route.js';

>>>>>>> origin/main

const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Everty API!' });
});

// Events routes
router.use('/events', eventRoutes);

// TODO: Add feature routes here later
router.use('/events', eventRoutes);     // Mount all event-related endpoints
// import authRoutes from '../features/auth/auth.route.js';
// router.use('/auth', authRoutes);

export default router;