const express = require("express");
const router = express.Router();
const Slot = require("../models/slot");
const Station = require("../models/station");
const mongoose = require('mongoose');
const Booking = require("../models/booking");
const authenticateUser = require("./auth"); 
const { verifyToken } = require('../middleware/auth');

// 🔹 Fallback to recover user from token if authenticateUser fails
const safeUserFallback = (req, res, next) => {
    if (!req.user) {
        console.warn('⚠️ req.user is undefined - creating fallback user');

        const token = req.header("Authorization");
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const tokenValue = token.replace("Bearer ", "").trim();
                const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || "your_jwt_secret");
                req.user = decoded;
            } catch (tokenError) {
                console.error('❌ Token recovery failed:', tokenError.message);
                req.user = { id: 'fallback_user_id', isGuest: false, name: 'Fallback User' };
            }
        } else {
            req.user = { id: 'no_token_user', isGuest: false, name: 'Unknown User' };
        }
    }
    next();
};

// 🔹 Store selected station in session
router.post("/set-selected-station", (req, res) => {
    const { stationId, stationName, address, ownerPhone } = req.body;

    if (!stationId || !stationName) {
        return res.status(400).json({ error: "Missing station details" });
    }

    req.session.selectedStation = { stationId, stationName, address, ownerPhone };
    console.log("Station stored in session:", req.session.selectedStation);
    res.json({ success: true, message: "Station saved in session" });
});

// 🔹 Get selected station from session
router.get("/get-selected-station", (req, res) => {
    if (!req.session.selectedStation) {
        return res.status(404).json({ error: "No station selected" });
    }
    res.json(req.session.selectedStation);
});

// 🔹 Get selected station from DB
router.get("/get-selected-station/:stationId", async (req, res) => {
    try {
        const stationId = req.params.stationId;
        if (!stationId) {
            return res.status(400).json({ error: "Station ID is required" });
        }

        const station = await Station.findOne({ stationId }).populate("chargingPoints");
        if (!station) {
            return res.status(404).json({ error: "Station not found" });
        }

        res.json({
            stationId: station.stationId,
            stationName: station.stationName,
            address: station.address || "Not available",
            ownerPhone: station.ownerPhone || "Not available",
            location: station.location,
            chargingPoints: station.chargingPoints || [],
        });
    } catch (error) {
        console.error("Error fetching selected station:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Middleware to enforce guest booking limits
const checkGuestLimits = async (req, res, next) => {
    try {
        if (!req.user) return next();

        const isGuest = Boolean(req.user.isGuest);
        const userId = req.user.id || req.user._id || 'unknown_user';

        if (!isGuest) return next();

        const guestLimits = { maxBookings: 2 }; // Default guest limits
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const guestBookings = await Booking.countDocuments({ 
            userId: userId,
            createdAt: { $gte: today }
        });

        if (guestBookings >= guestLimits.maxBookings) {
            return res.status(403).json({ 
                success: false,
                message: `Guest accounts are limited to ${guestLimits.maxBookings} bookings per day.`,
                limitExceeded: true,
                currentBookings: guestBookings,
                maxBookings: guestLimits.maxBookings
            });
        }
        next();
    } catch (error) {
        console.error('Guest limits error:', error.message);
        next(); // Do not block booking if limit check fails
    }
};

// 🔹 Book slot
router.post("/book-slot", authenticateUser, safeUserFallback, checkGuestLimits, async (req, res) => {
    try {
        const { stationId, pointId, slots, bookingDate } = req.body;

        if (!stationId || !pointId || !slots || !bookingDate) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Normalize slots into an array of numbers
        let slotNumbers = Array.isArray(slots) ? slots : String(slots).replace(/[\[\]]/g, "").split(",").map(s => parseInt(s.trim(), 10));
        slotNumbers = slotNumbers.filter(n => !isNaN(n));
        if (slotNumbers.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid slot numbers provided" });
        }

        // Check availability
        const availableSlots = await Slot.find({
            stationCustomId: stationId,
            pointId: pointId,
            slotNumber: { $in: slotNumbers },
            isBooked: false
        });

        if (availableSlots.length !== slotNumbers.length) {
            const bookedSlotNumbers = slotNumbers.filter(requestedSlot => 
                !availableSlots.some(availableSlot => availableSlot.slotNumber === requestedSlot)
            );
            return res.status(409).json({ success: false, message: "Some slots are already booked", conflictingSlots: bookedSlotNumbers });
        }

        // Create booking
        const newBooking = new Booking({
            ...req.body,
            slots: slotNumbers,
            slotNumbers: slotNumbers,
            status: "confirmed",
            createdAt: new Date(),
            userId: req.user.id, 
            userName: req.user.name || "Guest User",   
            userPhone: req.user.mobile || req.body.userPhone || "N/A" 
        });


        const savedBooking = await newBooking.save();

        // Mark slots as booked
        await Slot.updateMany(
            { stationCustomId: stationId, pointId: pointId, slotNumber: { $in: slotNumbers } },
            { $set: { isBooked: true } }
        );

        res.status(201).json({ success: true, message: "Booking confirmed", bookingId: savedBooking._id, data: savedBooking });
    } catch (error) {
        console.error("Booking creation error:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

//  Get available slots
router.get('/slots/available', async (req, res) => {
    const { stationId, pointId, date } = req.query;
    const allSlots = Array.from({ length: 48 }, (_, i) => i + 1); 
    const booked = await Booking.find({ stationId, pointId, bookingDate: date, status: { $in: ['confirmed', 'completed'] } }).distinct('slotNumbers');
    const flatBooked = [...new Set(booked.flat())];
    const available = allSlots.filter(s => !flatBooked.includes(s));
    res.json(available);
});

// Get user's booking history
router.get("/user-bookings/:mobile", async (req, res) => {
    try {
        const { mobile } = req.params;
        const bookings = await Booking.find({ userPhone: mobile }).sort({ bookingTime: -1 });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching booking history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const { authenticateOwner } = require('../middleware/auth');

//  Get today's bookings for owner's station
router.get("/owner/today", async (req, res) => {
    try {
        const { stationId } = req.query;
        if (!stationId) return res.status(400).json({ error: "stationId is required" });

        const today = new Date();
        const possibleDateFormats = [
            today.toISOString().split('T')[0],
            today.toLocaleDateString('en-IN'),
            today.toLocaleDateString('en-CA'),
            today.toDateString(),
        ];

        let todayBookings = [];
        for (const dateFormat of possibleDateFormats) {
            const bookings = await Booking.find({ stationId, bookingDate: dateFormat }).sort({ bookingTime: 1 });
            if (bookings.length > 0) {
                todayBookings = bookings;
                break;
            }
        }

        if (todayBookings.length === 0) {
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
            todayBookings = await Booking.find({ stationId, bookingTime: { $gte: startOfDay, $lte: endOfDay } }).sort({ bookingTime: 1 });
        }

        res.json(todayBookings);
    } catch (error) {
        console.error("Error fetching today's bookings:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//  Get bookings by station and optional filters
router.get('/station/:stationId', async (req, res) => {
    try {
        const { stationId } = req.params;
        const { date, status } = req.query;

        const filter = { stationId };
        if (date) {
            const start = new Date(date);
            const end = new Date(date); end.setDate(end.getDate() + 1);
            filter.bookingTime = { $gte: start, $lt: end };
        }
        if (status) filter.status = status;

        const bookings = await Booking.find(filter);
        res.json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update booking status (completed/cancelled) and release slots
router.patch('/:bookingId/status', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!bookingId) return res.status(400).json({ error: 'Booking ID is required' });
        if (!['completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        let booking;
        if (mongoose.Types.ObjectId.isValid(bookingId)) booking = await Booking.findById(bookingId);
        if (!booking) booking = await Booking.findOne({ _id: bookingId });
        if (!booking) booking = await Booking.findOne({ $or: [{ _id: bookingId }, { bookingId }] });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        booking.status = status;
        booking.updatedAt = new Date();
        const updatedBooking = await booking.save();

        if (['completed', 'cancelled'].includes(status)) {
            await Slot.updateMany(
                { stationCustomId: updatedBooking.stationId, pointId: updatedBooking.pointId, slotNumber: { $in: updatedBooking.slotNumbers } },
                { $set: { isBooked: false } }
            );
        }

        res.json({ success: true, message: `Booking ${status} successfully`, booking: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Server error updating booking status', details: error.message });
    }
});

//  Get already booked slots
router.get('/booked-slots', async (req, res) => {
    try {
        const bookedSlotsData = await Slot.find({ isBooked: true });
        const bookedSlots = bookedSlotsData.map(slot => slot.slotNumber);
        return res.json({ bookedSlots });
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

//  Get active (confirmed) bookings for user
router.get("/active/:mobile", async (req, res) => {
    try {
        const { mobile } = req.params;
        const activeBookings = await Booking.find({ userPhone: mobile, status: "confirmed" }).sort({ bookingTime: -1 });
        res.json(activeBookings);
    } catch (error) {
        console.error("Error fetching active bookings:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//  Get guest booking count for today
router.get('/guest/count', authenticateUser, safeUserFallback, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({ success: true, count: 0, message: "No user authenticated" });
        }
        if (!req.user.isGuest) {
            return res.json({ success: true, count: 0, message: "User is not a guest" });
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const count = await Booking.countDocuments({ userId: req.user.id, createdAt: { $gte: today } });
        res.json({ success: true, count });
    } catch (error) {
        console.error('Guest count error:', error);
        res.status(200).json({ success: true, count: 0, error: "Error retrieving count" });
    }
});

module.exports = router;
