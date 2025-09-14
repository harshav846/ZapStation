const cron = require("node-cron");
const User = require("../models/user"); // Make sure the User model is imported

// Delete guest accounts older than 48 hours
const cleanupGuestAccounts = async () => {
    try {
        const result = await User.deleteMany({
            isGuest: true,
            createdAt: { $lt: new Date(Date.now() - 48 * 60 * 60 * 1000) } // older than 48 hours
        });
        console.log(`✅ Cleaned up ${result.deletedCount} guest accounts`);
    } catch (error) {
        console.error("❌ Guest account cleanup error:", error.message);
    }
};

// Schedule daily cleanup at 2 AM
cron.schedule("0 2 * * *", cleanupGuestAccounts);
