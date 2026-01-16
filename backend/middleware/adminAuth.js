const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer format) or x-auth-token header (fallback)
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Fallback to x-auth-token if Authorization header not present
    if (!token) {
      token = req.header('x-auth-token');
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    // Handle both token formats: { userId } and { user: { id } }
    const userId = decoded.userId || (decoded.user && decoded.user.id);
    
    if (!userId) {
      return res.status(401).json({ msg: 'Invalid token structure' });
    }

    // Check if user exists and is admin
    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(401).json({ msg: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    req.userId = userId;
    req.user = user;
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
