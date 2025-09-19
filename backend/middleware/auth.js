const jwt = require('jsonwebtoken');
const Station = require('../models/station');

// Middleware to authenticate station owners
const authenticateOwner = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the station by decoded info
        const station = await Station.findOne({ _id: decoded.id, stationId: decoded.stationId });
        if (!station) return res.status(401).json({ message: 'Station not found' });

        // Attach station to request
        req.station = station;
        next();

    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authenticateUser = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '').trim();
        if (!token) {
            return res.status(401).json({ error: 'Access Denied! No Token Provided.' });
        }

        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

        // Attach user object to request (must exist)
        req.user = {
            id: verified.id,
            name: verified.name,   
            mobile: verified.mobile, 
            email: verified.email || null,
            isGuest: verified.isGuest || false
        };

        next();

    } catch (error) {
        console.error('Authentication Error:', error);
        if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid Token!' });
        if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token Expired!' });
        res.status(500).json({ error: 'Authentication Error!' });
    }
};


module.exports = { authenticateOwner, authenticateUser };
