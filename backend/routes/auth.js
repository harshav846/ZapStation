const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user");
const Station = require("../models/station");

dotenv.config();
const router = express.Router();
router.use(express.json());

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/* ==============================
   User Authentication Routes
   ============================== */

// User Login
router.post("/login", async (req, res) => {
    try {
        const { loginInput, password } = req.body;

        // Check if login is by mobile number or email
        const isMobile = /^\d{10}$/.test(loginInput);
        const query = isMobile ? { mobile: loginInput } : { email: loginInput };

        // Find user
        const user = await User.findOne(query);
        if (!user) {
            return res.status(400).json({ error: "User not found. Please register." });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect password!" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, mobile: user.mobile, email: user.email, name: user.name},
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("Login Successful:", user.name, user.mobile);

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                name: user.name,
                mobile: user.mobile
            },
            redirect: "/index_main.html"
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// User Registration
router.post("/register", async (req, res) => {
    try {
        const { name, mobile, password, email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ mobile }, { email }] });
        if (existingUser) {
            console.log("⚠️ User already registered:", existingUser);
            return res.status(400).json({ error: "User already registered!" });
        }
        // Save user in DB
        const newUser = new User({ name, mobile, email, password});
        await newUser.save();
        console.log("New user saved in DB:", newUser);

        // Generate JWT for automatic login
        const token = jwt.sign(
            {
                id: newUser._id,
                name: newUser.name,
                mobile: newUser.mobile,
                email: newUser.email
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Construct response payload
        const responsePayload = {
            message: "Registration successful!",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                mobile: newUser.mobile,
                email: newUser.email
            },
            redirect: "/index_main.html"
        };

        res.status(201).json(responsePayload);

    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});


/* ==============================
   Guest Login (Temporary Users)
   ============================== */

router.post("/guest/login", async (req, res) => {
    try {
        console.log("Guest login request received");

        // Generate unique guest ID
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const guestUser = {
            id: guestId,
            name: "Guest User",
            mobile: `guest-${guestId}@example.com`,
            email: `guest-${guestId}@example.com`,
            isGuest: true,
            createdAt: new Date()
        };

        // Create token for guest
        const token = jwt.sign(
            {
                id: guestUser.id,
                isGuest: true,
                name: guestUser.name
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        console.log("Guest login successful for:", guestUser.name);

        // Default guest limits
        const guestLimits = {
            maxBookings: 2,
            maxStations: 5,
            readOnly: false
        };

        res.status(200).json({
            success: true,
            message: "Guest login successful!",
            token,
            user: {
                name: guestUser.name,
                mobile: guestUser.mobile,
                isGuest: true
            },
            guestLimits,
            redirect: "/index_main.html"
        });
    } catch (error) {
        console.error("Guest Login Error:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    }
});

/* ==============================
   Middleware for Auth Validation
   ============================== */
function authenticateToken(req, res, next) {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ error: "Access Denied! No Token Provided." });
    }

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        return res.status(400).json({ error: "Invalid Token!" });
    }
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;
