import express from 'express';
import userRoutes from "../features/users/user.route.js";


const router = express.Router();

// Placeholder route to confirm the API is working
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Eventy API!' });
});

router.use("/admin/users", userRoutes);

export default router;