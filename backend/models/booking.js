const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    stationId: { type: String, required: true },
    stationName: { type: String, required: true },
    pointId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    vehicleType: { type: String, required: true },
    chargerType: { type: String, required: true },
    slotNumbers: { type: [Number], required: true },
    bookingTime: { type: Date, required: true },
    bookingDate: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    cancellationReason: { type: String }, // ✅ Added for no-show tracking
    duration: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);