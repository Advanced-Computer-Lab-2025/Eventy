// Temporary mock authentication middleware for Events Office testing

export default (req, res, next) => {
  // Simulate a logged-in user
  req.user = {
    _id: '66f123abc987de00012ff999', // fake MongoDB ObjectId string
    name: 'Test Events Office User',
    role: 'EventsOffice'
  };

  // Allow the request to continue
  next();
};

/*
===========================
🔒 FUTURE JWT VERSION
===========================
Once real authentication is implemented, replace the mock middleware with this version.
It verifies the token, decodes it, and loads the real user from the database.

import jwt from 'jsonwebtoken';
import User from '../features/users/user.model.js';

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
*/
