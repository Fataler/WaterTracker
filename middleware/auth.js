const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');

        // Check if no token
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        
        // Find user
        const user = await User.findByPk(decoded.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid' });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token has expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware для проверки прав администратора
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'Authorization required' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admin rights required.' });
    }
    next();
};

module.exports = auth;
module.exports.admin = admin;
