import express from 'express';
import authRoutes from '../features/auth/auth.route.js';
import { verifyToken } from "../middlewares/auth.middleware.js";


const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Everty API!' });
});

// TODO: Add feature routes here later
// import authRoutes from '../features/auth/auth.route.js';
router.use('/auth', authRoutes);


// Example of protected routes
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.email}!`,
    user: req.user,
  });
});

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    message: `This is a protected dashboard for ${req.user.role}`,
  });
});

export default router;
