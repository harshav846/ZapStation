// Run when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
    let userData = sessionStorage.getItem("userData");

    // Redirect to login if user not found
    if (!userData) {
        alert("You must log in to view booking history!");
        window.location.href = "/index_login.html";
        return;
    }

    userData = JSON.parse(userData); 

    await fetchBookingHistory(userData.mobile);
});

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
        let response = await fetch(`http://localhost:5000/bookings/user-bookings/${mobile}`);
        let bookings = await response.json();

        // Show message if no bookings found
        if (!Array.isArray(bookings) || bookings.length === 0) {
            document.querySelector("#historyTable tbody").innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">No booking history found.</td>
                </tr>`;
            return;
        }

        // Sort bookings by latest first
        bookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

        let historyHTML = "";
        bookings.forEach((booking, index) => {
            // Color coding for status
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
        
        // Insert rows into table
        document.querySelector("#historyTable tbody").innerHTML = historyHTML;

    } catch (error) {
        console.error("❌ Error fetching booking history:", error);
    }
}
