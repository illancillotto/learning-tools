const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Add debug logging
    console.log('Auth Middleware - Headers:', req.headers.authorization);

    // Check if authorization header exists and starts with 'Bearer '
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    // Extract the token
    const token = req.headers.authorization.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware - Decoded token:', decoded);

    // Set the user info on the request object
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

module.exports = authMiddleware;