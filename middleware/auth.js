const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization; 

    // Check if header exists
    if (!authHeader) {
      return res.status(401).json({ message: 'Access denied. No token provided' });
    }

    // Expect format: Bearer TOKEN
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let role = decoded.role;

    if (!role) {
      const user = await User.findById(decoded.id).select('role');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      role = user.role;
    }

    // attach user data to request
    req.user = {
      id: decoded.id,
      role,
      registrationType: decoded.registrationType
    };

    next();

  } catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ 
      message: 'Invalid token',
      error: err.message
    });
  }
};

module.exports = { authMiddleware };