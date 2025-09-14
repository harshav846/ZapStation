const express = require("express");
const twilio = require("twilio");
require("dotenv").config();
const User = require("../models/user");

const router = express.Router();

// 🔹 Twilio client setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 🔹 Temporary in-memory OTP store
const otpStore = {};

/* ==============================
   OTP Sending
   ============================== */
router.post("/send-otp", async (req, res) => {
    try {
        const { mobile } = req.body;

        // Validate mobile number (must be 10 digits)
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ error: "Invalid mobile number!" });
        }

        // Generate OTP (6 digits)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP temporarily
        otpStore[mobile] = otp;

        // Send OTP via Twilio
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${mobile}`,
        });

        console.log("📩 OTP Sent:", otp);
        res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        res.status(500).json({ error: "Failed to send OTP!" });
    }
});

/* ==============================
   OTP Verification
   ============================== */
router.post("/verify-otp", async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        // Validate input
        if (!mobile || !otp) {
            return res.status(400).json({ error: "Mobile number and OTP are required!" });
        }

        // Verify OTP
        if (otpStore[mobile] && otpStore[mobile] === otp) {
            delete otpStore[mobile]; // Remove OTP once verified

            const user = await User.findOne({ mobile });

            if (user) {
                return res.status(200).json({ 
                    message: "OTP verified", 
                    userExists: true 
                });
            } else {
                return res.status(200).json({ 
                    message: "OTP verified", 
                    userExists: false 
                });
            }
        } else {
            return res.status(400).json({ error: "Invalid OTP or expired!" });
        }
    } catch (error) {
        console.error("❌ Error verifying OTP:", error);
        res.status(500).json({ error: "Failed to verify OTP!" });
    }
});

module.exports = router;
