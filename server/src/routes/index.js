import express from 'express';
import userRoutes from "../features/users/user.route.js";
import eventRoutes from '../features/events/event.route.js';


const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Eventy API!' });
});

router.use("/admin/users", userRoutes);
// TODO: Add feature routes here later
router.use('/', eventRoutes);     // Mount all event-related endpoints
// import authRoutes from '../features/auth/auth.route.js';
// router.use('/auth', authRoutes);

export default router;