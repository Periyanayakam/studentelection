import jwt from 'jsonwebtoken';

// Authenticate JWT Token
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Format: Bearer <token>
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token format is invalid' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforonlinevotingsystem2026', (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token is invalid or expired' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Authorization header is missing' });
  }
};

// Check if user is Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required' });
  }
};

// Check if user is Voter
export const isVoter = (req, res, next) => {
  if (req.user && req.user.role === 'voter') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Voter privileges required' });
  }
};
