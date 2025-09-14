const mongoose = require("mongoose");

// Schema for a charging slot
const SlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true },          // Slot number within a point
    startTime: { type: String, required: true },          // Start time of the slot (HH:MM format)
    endTime: { type: String, required: true },            // End time of the slot (HH:MM format)
    isBooked: { type: Boolean, default: false },         // Indicates if the slot is booked

    // References to station and point
    stationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Station", 
        required: true 
    },
    stationCustomId: { 
        type: String,
        required: true 
    },                                                     // Human-readable station ID
    pointId: { 
        type: String, 
        required: true 
    }                                                      // Point ID within the station
}, { 
    timestamps: true                                      // Automatically adds createdAt and updatedAt
});

// Ensure slots are unique per station-point combination
SlotSchema.index({ stationId: 1, pointId: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model("Slot", SlotSchema);
