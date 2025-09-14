const mongoose = require("mongoose");

// Schema for a charging point at a station
const pointSchema = new mongoose.Schema({
    stationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Station", 
        required: true 
    },                                                // Reference to Station
    pointId: { type: String, required: true },       // Unique ID of the point within the station
    chargerType: { type: String, required: true },   // Charger type (CCS, CHAdeMO, Type 2)
    chargingType: { type: String, required: true },  // Fast, Standard, or Socket
    vehicleType: { type: [String], required: true }, // Vehicle types supported
    maxPoints: { type: Number, required: true },     // Maximum number of vehicles that can charge simultaneously
    slots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Slot" }] // Reference to slots for this point
});

// Compound index to ensure pointId is unique per station
pointSchema.index({ stationId: 1, pointId: 1 }, { unique: true });

// Export the model
module.exports = mongoose.model("Point", pointSchema);
