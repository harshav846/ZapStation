const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Schema for user registration
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },                   // User's full name
    mobile: { type: String, required: true, unique: true },   // Unique mobile number (primary identifier)
    password: { type: String, required: true },               // Hashed password
    email: { type: String, required: true, unique: true }     // Email address (unique)
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to verify password during login
UserSchema.methods.verifyPassword = async function(inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
