# ZAP Station – EV Charging Station Locator & Booking System  

ZAP Station is a web-based project that helps users find EV charging stations, book slots, and manage bookings in real time.  
It also includes an Owner Dashboard for station operators to manage daily operations and view historical bookings.  

**Note:** The main focus of this project is on the **Booking System** (slot selection, management, verification, and history).  

---

## Features  

### User Side  
- OTP-based Login & Registration (via Twilio)  
- Guest Login Mode (with limited access)  
- Leaflet Map Integration to locate nearest stations  
- Slot Booking with rules:  
  - Only same-day bookings allowed  
  - Minimum 1 slot, Maximum 4 slots per booking  
- Booking History with status updates ( `Confirmed`, `Completed`, `Cancelled`)  
- Manual Payment at Station (after verification)  

### Owner Side  
- Login via Station ID  
- Daily Operations Dashboard – view & verify bookings in real time  
- Historical Bookings Dashboard – filter by day, month, year  
- Booking Verification Flow – mark bookings as `Completed` or `Cancelled`  
- Auto-Cancellation of expired or no-show bookings  

### Backend Features  
- Node.js + Express.js + MongoDB  
- JWT Authentication  
- Daily Reset Cron Job (node-cron)  
  - Cancels unverified bookings from past dates  
  - Frees up booked slots automatically at midnight  

---

## Tech Stack  

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** JWT, Twilio OTP  
- **Maps API:** Leaflet.js  
- **Scheduler:** node-cron  

---

## Installation & Setup

### Prerequisites

- Node.js (v16+ recommended)
- npm
- MongoDB (local or Atlas)
- Git
- Twilio account (for OTP-based login)

---

### Environment Variables

1. Create a `.env` file in the **backend** directory with:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```


2. The **frontend** runs directly from the `/public` directory.  
- If deploying, update API calls in the frontend JS files to point to your backend (replace `http://localhost:5000` with your deployed backend URL).

---

### Running the Project

1. **Clone the repository**:

```bash
git clone https://github.com/harshav846/ZAPStation.git
cd ZAPStation
```


2. **Install backend dependencies**:
```
cd backend
npm install
```
3. **Start the backend server**:
```
node server.js
```
4. **Access the application**:

    Frontend: Open public/index_login.html in your browser

    Backend API: http://localhost:5000
   
   ---
   

 5. **Daily Reset Cron Job**:
  
    To automatically cancel expired bookings and release slots (for testing purpose):
  ```
    node backend/cron/dailyReset.js
