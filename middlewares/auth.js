// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        let token = req.header('Authorization');

        // If no token, just continue without auth (next route will handle if auth is required)
        if (!token) {
            req.auth = { isAuthenticated: false };
            return next();
        }

        if (typeof token !== 'string') {
            return res.status(403).json({
                message: 'Invalid authorization headers.'
            });
        }

        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user info to request
            req.auth = {
                token,
                isAuthenticated: true,
                user: decoded.user
            };
        } catch (err) {
            req.auth = { isAuthenticated: false };
            console.error('Token verification failed:', err.message);
        }

        return next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.auth = { isAuthenticated: false };
        return next();
    }
};

// Middleware for requiring authentication
const requireAuth = (req, res, next) => {
    if (!req.auth || !req.auth.isAuthenticated) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    return next();
};

// Middleware for checking admin role
const adminAuth = (req, res, next) => {
    if (!req.auth || !req.auth.isAuthenticated) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.auth.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
    }

    return next();
};

// Middleware for checking team lead role
const teamLeadAuth = (req, res, next) => {
    if (!req.auth || !req.auth.isAuthenticated) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.auth.user.role !== 'Admin' && req.auth.user.role !== 'TeamLead') {
        return res.status(403).json({ message: 'Team Lead privileges required' });
    }

    return next();
};

module.exports = { auth, requireAuth, adminAuth, teamLeadAuth };