import express from 'express';
import userRoutes from "../features/users/user.route.js";
import eventRoutes from '../features/events/event.route.js';
import applicationRoutes from '../features/applications/application.route.js';
import facilityRoutes from '../features/facilities/facility.route.js';
const PORT = process.env.PORT || 5000;
const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Eventy API!' });
});

router.use("/admin/users", userRoutes);
// import authRoutes from '../features/auth/auth.route.js';
// router.use('/auth', authRoutes);

// Events routes
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
// Applications routes
router.use('/applications', applicationRoutes);
//facilities routes
router.use('/facilities', facilityRoutes);
export default router;
