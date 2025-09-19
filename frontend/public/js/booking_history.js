// Run when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    let userDataRaw = sessionStorage.getItem("userData");
    let userData = null;

    try {
        if (userDataRaw) {
            userData = JSON.parse(userDataRaw);
        }
    } catch (err) {
        console.error("❌ Failed to parse userData:", err, "Raw:", userDataRaw);
        userData = null;
    }
    

    if (!userData) {
        const token = localStorage.getItem("authToken");
        
        if (token) {
            // Try to decode user info from token
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userData = {
                    name: payload.name,
                    mobile: payload.mobile,
                    email: payload.email
                };
                sessionStorage.setItem("userData", JSON.stringify(userData));
            } catch (error) {
                console.error("Error decoding token:", error);
                redirectToLogin();
                return;
            }
        } else {
            redirectToLogin();
            return;
        }
    }
    await fetchBookingHistory(userData.mobile);
});

function redirectToLogin() {
    alert("You must log in to view booking history!");
    window.location.href = "/index_login.html";
}

// Format slot numbers into a clean string
function formatSlotNumbers(slotNumbers) {
    if (!Array.isArray(slotNumbers) || slotNumbers.length === 0) return 'N/A';
    
    return slotNumbers
        .filter(slot => typeof slot === 'number' || typeof slot === 'string')
        .map(slot => Number(slot)) 
        .sort((a, b) => a - b)
        .join(', ');
}

// Fetch booking history for a user
async function fetchBookingHistory(mobile) {
    try {
        showLoader();

        let response = await fetch(`https://zapstation.onrender.com/bookings/user-bookings/${mobile}`);
        let bookings = await response.json();

        // Show message if no bookings found
        if (!Array.isArray(bookings) || bookings.length === 0) {
            document.querySelector("#historyTable tbody").innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">No booking history found.</td>
                </tr>`;
            return;
        }
        bookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

        let historyHTML = "";
        bookings.forEach((booking, index) => {
            let statusColor =
                booking.status === "cancelled" ? "red"
                : booking.status === "confirmed" ? "hsla(150, 97.60%, 48.60%, 0.70)"
                : booking.status === "completed" ? "green"
                : "black";
        
            historyHTML += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.stationName || "Unknown"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.chargerType || "N/A"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${new Date(booking.bookingTime).toLocaleString()}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${booking.vehicleType || "N/A"}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${formatSlotNumbers(booking.slotNumbers)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: ${statusColor}; font-weight: bold;">
                        ${booking.status || "PENDING"}
                    </td>
                </tr>
            `;
        });
        document.querySelector("#historyTable tbody").innerHTML = historyHTML;

    } catch (error) {
        console.error("❌ Error fetching booking history:", error);
        alert("Failed to load booking history. Please try again.");
    } finally {
        hideLoader(); 
    }
}
