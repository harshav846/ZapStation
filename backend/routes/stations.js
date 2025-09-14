const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Station = require("../models/station");
const Point = require("../models/point");
const Slot = require("../models/slot");

/* ==============================
   Get All Stations
   ============================== */
router.get("/get-stations", async (req, res) => {
    try {
        const stations = await Station.find({}, {
            stationId: 1,
            stationName: 1,
            location: 1,
            ownerPhone: 1,
            address: 1,
            chargingPoints: 1
        });

        if (!stations || stations.length === 0) {
            return res.status(404).json({ error: "No stations found" });
        }

        res.json(stations);
    } catch (error) {
        console.error("Error fetching stations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ==============================
   Get Station Details
   ============================== */
router.get("/:stationId/details", async (req, res) => {
    try {
        const station = await Station.findOne({ stationId: req.params.stationId });
        if (!station) return res.status(404).json({ error: "Station not found" });

        res.json({
            stationId: station.stationId,
            stationName: station.stationName,
            address: station.address || "Not available",
            ownerPhone: station.ownerPhone || "Not available",
            location: station.location,
        });
    } catch (error) {
        console.error("Error fetching station details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ==============================
   Get Charging Points for a Station
   ============================== */
router.get("/:stationId/charging-points", async (req, res) => {
    try {
        const stationId = req.params.stationId;
        const station = await Station.findOne({ stationId });
        if (!station) return res.status(404).json({ error: "Station not found" });

        const chargingPoints = await Point.find({ stationId: station._id });
        if (!chargingPoints.length) {
            return res.status(404).json({ error: "No charging points found" });
        }

        res.json(chargingPoints.map(point => ({
            pointId: point.pointId,
            chargerType: point.chargerType,
            chargingType: point.chargingType,
            vehicleType: point.vehicleType
        })));
    } catch (error) {
        console.error("Error fetching charging points:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ==============================
   Get Charging Point Details + Available Slots
   ============================== */
router.get("/:stationId/charging-point/:pointId", async (req, res) => {
    try {
        const { stationId, pointId } = req.params;
        const station = await Station.findOne({ stationId });
        if (!station) return res.status(404).json({ error: "Station not found" });

        const chargingPoint = await Point.findOne({ stationId: station._id, pointId });
        if (!chargingPoint) return res.status(404).json({ error: "Charging point not found" });

        const availableSlots = await Slot.find({ 
            _id: { $in: chargingPoint.slots }, 
            isBooked: false 
        });

        res.json({
            pointId: chargingPoint.pointId,
            chargerType: chargingPoint.chargerType,
            chargingType: chargingPoint.chargingType,
            vehicleType: chargingPoint.vehicleType,
            maxPoints: chargingPoint.maxPoints,
            availableSlots: availableSlots.map(slot => ({
                slotNumber: slot.slotNumber,
                startTime: slot.startTime,
                endTime: slot.endTime
            }))
        });
    } catch (error) {
        console.error("Error fetching charging point details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ==============================
   Get Available Slots for a Station & Point
   ============================== */
router.get("/:stationCustomId/available-slots", async (req, res) => {
    try {
        const { stationCustomId } = req.params;
        const { pointId } = req.query;

        if (!pointId) {
            return res.status(400).json({ error: "Charging Point ID is required" });
        }

        const station = await Station.findOne({ stationId: stationCustomId });
        if (!station) return res.status(404).json({ error: "Station not found" });

        const availableSlots = await Slot.find({
            stationCustomId: stationCustomId,
            pointId: pointId,
            isBooked: false
        });

        res.json({
            stationId: station.stationId,
            pointId: pointId,
            availableSlots: availableSlots.map(slot => ({
                slotId: slot._id,
                slotNumber: slot.slotNumber,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: slot.isBooked
            }))
        });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* ==============================
   Session Handling (Selected Station)
   ============================== */
router.post("/set-selected-station", (req, res) => {
    const { stationId, stationName, address, ownerPhone } = req.body;

    if (!stationId || !stationName) {
        return res.status(400).json({ error: "Missing station details" });
    }

    req.session.selectedStation = { stationId, stationName, address, ownerPhone };
    res.json({ success: true, message: "Station saved in session" });
});

router.get("/get-selected-station", (req, res) => {
    if (!req.session.selectedStation) {
        return res.status(404).json({ error: "No station selected" });
    }
    res.json(req.session.selectedStation);
});

router.get("/get-selected-station/:stationId", async (req, res) => {
    try {
        const stationId = req.params.stationId;
        if (!stationId) {
            return res.status(400).json({ error: "Station ID is required" });
        }

        const station = await Station.findOne({ stationId }).populate("chargingPoints");
        if (!station) return res.status(404).json({ error: "Station not found" });

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

/* ==============================
   Debug Route: List All Stations
   ============================== */
router.get("/debug/all-stations", async (req, res) => {
    try {
        const stations = await Station.find({});
        const stationList = stations.map(station => ({
            stationId: station.stationId,
            _id: station._id,
            stationName: station.stationName
        }));
        
        res.json({
            message: "All stations in database",
            count: stations.length,
            stations: stationList
        });
    } catch (error) {
        console.error("Debug error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
