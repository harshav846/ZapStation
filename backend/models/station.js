const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

// Schema for EV charging station
const StationSchema = new mongoose.Schema({
    stationId: { type: String, required: true, unique: true },  // Unique station identifier
    stationpassword: { type: String, required: true },           // Password for station owner login
    stationName: { type: String, required: true },               // Name of the station
    location: {
        latitude: { type: Number, required: true },             // Latitude of the station
        longitude: { type: Number, required: true }             // Longitude of the station
    },
    address: { type: String, required: true },                  // Full address
    ownerPhone: { type: String, required: true },               // Owner's contact number
    chargingPoints: [{ type: mongoose.Schema.Types.ObjectId, ref: "Point" }] // Associated charging points
});

// Pre-save hook: Hash password before saving to database
StationSchema.pre('save', async function(next) {
    if (!this.isModified('stationpassword')) return next();
    this.stationpassword = await bcrypt.hash(this.stationpassword, 10);
    next();
});

module.exports = mongoose.model("Station", StationSchema);
