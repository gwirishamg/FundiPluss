const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            
            // Get user from database
            const [users] = await promisePool.query(
                'SELECT id, firstName, lastName, email, phoneNumber, role, isActive FROM users WHERE id = ?',
                [decoded.id]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            const user = users[0];
            
            if (!user.isActive) {
                return res.status(403).json({ message: 'Account is deactivated' });
            }
            
            req.user = user;
            next();
            
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

const professional = (req, res, next) => {
    if (req.user && req.user.role === 'professional') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as professional' });
    }
};

const customer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as customer' });
    }
};

module.exports = { protect, admin, professional, customer };