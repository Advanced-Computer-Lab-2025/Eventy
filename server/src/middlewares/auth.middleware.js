
// Temporary mock authentication middleware for events office to test

module.exports = (req, res, next) => {
    // Simulate a logged-in user for testing
    req.user = {
      _id: '66f123abc987de00012ff999', // fake MongoDB ObjectId string
      name: 'Test Events Office User',
      role: 'EventsOffice'
    };
  
    // Allow the request to continue
    next();
  };
  
  /* replace this with the actual authentication middleware in the future :
  const jwt = require('jsonwebtoken');
const User = require('../features/users/user.model');

module.exports = async (req, res, next) => {
  try {
    // 1. Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch user from database
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 5. Attach user to request and continue
    req.user = user;
    next();
  } catch (err) {
    // 6. Handle invalid or expired token
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}; */
  
  