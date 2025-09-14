/*const Booking = require('../models/booking');

const guestLimits = {
    // Check booking limits for guests
    checkBookingLimit: async (req, res, next) => {
        if (req.user && req.user.isGuest) {
            const guestBookings = await Booking.countDocuments({ 
                userId: req.user.id,
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
            
            if (guestBookings >= 2) {
                return res.status(403).json({ 
                    error: "Guest accounts are limited to 2 bookings per day. Please create an account for full access." 
                });
            }
        }
        next();
    },

    // Prevent certain actions for guests
    restrictActions: (req, res, next) => {
        if (req.user && req.user.isGuest) {
            // Prevent deletion/modification of important data
            if (req.method !== 'GET' && req.method !== 'POST') {
                return res.status(403).json({ 
                    error: "Guest accounts cannot modify data. Please create an account." 
                });
            }
        }
        next();
    },

    // Add guest indicators to responses
    addGuestIndicators: (req, res, next) => {
        if (req.user && req.user.isGuest) {
            // Add guest info to response
            res.setHeader('X-Account-Type', 'guest');
        }
        next();
    }
};

module.exports = guestLimits;*/