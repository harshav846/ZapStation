const dev = "http://localhost:5000"; // for local testing
const prod = "https://your-backend-domain.com"; // your deployed backend URL

// Export API URL based on environment
const API_BASE_URL = process.env.NODE_ENV === "production" ? prod : dev;

module.exports = { API_BASE_URL };
