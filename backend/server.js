const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const app = express();


app.get("/test", (req, res) => {
  res.send("Static serving test works ✅");
});

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();


/* ==============================
   Middleware
   ============================== */
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Configure Session
app.use(session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // ⚠️ set true in production with HTTPS
}));

/* ==============================
   Routes
   ============================== */
const otpRoutes = require("./routes/otp");
const authRoutes = require("./routes/auth");
const stationRoutes = require("./routes/stations");
const bookingRoutes = require("./routes/bookings");
const ownerAuthRoutes = require("./routes/owner");

// Mount routes
app.use("/otp", otpRoutes);
app.use("/auth", authRoutes);
app.use("/stations", stationRoutes);
app.use("/bookings", bookingRoutes);
app.use("/owner", ownerAuthRoutes);

// ❌ Removed duplicate app.use('/api/bookings', bookingRoutes);
//    (You already mount bookings at /bookings)

/* ==============================
   Cron Jobs
   ============================== */
require("./cron/dailyReset");
require("./cron/guestData");

/* ==============================
   Start Server
   ============================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
