const cron = require("node-cron");
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables from project root
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Booking = require("../models/booking");
const Slot = require("../models/slot");

// Connect to MongoDB if not already connected
async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB");
  }
}

// Release booked slots and cancel no-show bookings daily
async function releaseSlots() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log("🔄 Starting daily reset for date:", today);

    // 1. Cancel today's confirmed bookings where user did not show up
    await Booking.updateMany(
      { bookingDate: today, status: "confirmed" },
      {
        status: "cancelled",
        cancellationReason: "No-show at station (auto-cancelled)",
        updatedAt: new Date(),
      }
    );

    // 2. Reset all booked slots to available
    await Slot.updateMany(
      { isBooked: true },
      { $set: { isBooked: false, updatedAt: new Date() } }
    );

    console.log("✅ Daily reset completed: Slots released and no-shows cancelled");
  } catch (error) {
    console.error("❌ Daily reset error:", error.message);
  }
}

// Schedule daily reset at midnight
cron.schedule("0 0 * * *", () => {
  connectDB().then(() => releaseSlots());
});

// If run directly, perform a manual reset
/*if (require.main === module) {
  (async function runManualReset() {
    await connectDB();
    await releaseSlots();
    await mongoose.connection.close();
  })();
}*/

module.exports = { releaseSlots };
