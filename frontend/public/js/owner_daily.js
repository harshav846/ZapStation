import { API_BASE_URL } from "../config/url.js";
document.addEventListener("DOMContentLoaded", async () => {
    const stationId = sessionStorage.getItem("ownerStationId"); // Get logged-in owner's station ID

    if (!stationId) {
        alert("Station not found. Please log in again.");
        return;
    }

    try {
        // Fetch today's bookings for this station
        const res = await fetch(`${API_BASE_URL}/owner/daily/${stationId}`);
        if (!res.ok) throw new Error("Failed to fetch bookings");

        const bookings = await res.json();

        const tbody = document.querySelector("#dailyTable tbody");
        tbody.innerHTML = ""; // Clear existing rows

        // Populate table with booking data
        bookings.forEach((b) => {
            tbody.innerHTML += `
                <tr>
                    <td>${b.userName}</td>
                    <td>${b.userPhone}</td>
                    <td>${b.vehicleType}</td>
                    <td>${b.slots.join(", ")}</td>
                    <td>${b.status}</td>
                    <td>
                        <button onclick="markCompleted('${b._id}')">Complete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        alert("Error loading bookings. Please try again.");
        console.error("Daily Bookings Error:", error);
    }
});

// Mark booking as completed
async function markCompleted(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/owner/update-status/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
        });

        if (res.ok) {
            alert("Booking marked as completed!");
            location.reload(); // Refresh table
        } else {
            alert("Failed to update status");
        }
    } catch (error) {
        alert("Error updating booking status");
        console.error("Update Status Error:", error);
    }
}
