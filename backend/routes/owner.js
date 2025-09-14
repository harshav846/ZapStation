const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Station = require('../models/station');
const Booking = require('../models/booking');   // ✅ Missing import fixed
const { authenticateOwner } = require('../middleware/auth');

const router = express.Router();

/* ==============================
   Owner Login
   ============================== */
router.post('/login', async (req, res) => {
    try {
        const { stationId, stationPassword } = req.body;

        if (!stationId || !stationPassword) {
            return res.status(400).json({ message: 'Station ID and password are required' });
        }

        // Find station
        const station = await Station.findOne({ stationId });
        if (!station) {
            return res.status(404).json({ message: 'Station not found' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(stationPassword, station.stationpassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { stationId: station.stationId, id: station._id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            stationId: station.stationId,
            stationName: station.stationName,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/* ==============================
   Owner Dashboard
   ============================== */
router.get('/dashboard', authenticateOwner, async (req, res) => {
    try {
        const station = await Station.findOne({ stationId: req.station.stationId });
        res.json(station);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* ==============================
   Booking History (Filter by Year/Month/Day)
   ============================== */
router.get('/history/:stationId', authenticateOwner, async (req, res) => {
    try {
        const { stationId } = req.params;
        const { year, month, day } = req.query;

        // Ensure owner is authorized for this station
        const station = await Station.findOne({
            _id: req.station.id,
            stationId: stationId
        });

        if (!station) {
            return res.status(403).json({ message: 'Not authorized for this station' });
        }

        // Build filter
        const filter = { stationId };
        if (year || month || day) {
            filter.bookingTime = {};

            if (year) {
                filter.bookingTime.$gte = new Date(`${year}-01-01`);
                filter.bookingTime.$lt = new Date(`${parseInt(year) + 1}-01-01`);
            }
            if (month) {
                filter.bookingTime.$gte = new Date(`${year}-${month}-01`);
                filter.bookingTime.$lt = new Date(`${year}-${parseInt(month) + 1}-01`);
            }
            if (day) {
                filter.bookingTime.$gte = new Date(`${year}-${month}-${day}`);
                filter.bookingTime.$lt = new Date(`${year}-${month}-${parseInt(day) + 1}`);
            }
        }

        const bookings = await Booking.find(filter)
            .sort({ bookingTime: -1 })
            .lean();

        res.json(bookings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
