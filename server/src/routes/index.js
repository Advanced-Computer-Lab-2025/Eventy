
import express from 'express';
import eventRoutes from '../features/events/event.route.js'

const PORT = process.env.PORT || 5000;
const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Everty API!' });
});

// Events routes
router.use('/events', eventRoutes);

export default router;
