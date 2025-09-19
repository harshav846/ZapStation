// Load active bookings for the logged-in user
async function loadActiveBookings() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  
  // Redirect to login if user not found
  if (!userData || !userData.mobile) {
    alert("Please log in to view active bookings.");
    window.location.href = "/index_login.html";
    return;
  }

  const mobile = userData.mobile;

  try {
    showLoader(); 

    // Fetch only bookings with "confirmed" status
    const response = await fetch(`/bookings/active/${mobile}`);
    if (!response.ok) throw new Error("Failed to fetch active bookings");
    
    const activeBookings = await response.json();
    renderActiveBookings(activeBookings);

  } catch (err) {
    console.error("Error loading active bookings:", err);
    alert(err.message);
  } finally {
    hideLoader(); 
  }
}

// Render active bookings into the table
function renderActiveBookings(bookings) {
  const tbody = document.getElementById("active-bookings-list");
  
  // Show message if no active bookings found
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">✅ No active bookings. All completed or cancelled.</td></tr>`;
    return;
  }

  // Generate table rows dynamically
  tbody.innerHTML = bookings.map((booking, index) => {
    let statusColor = "black";
    if (booking.status === "confirmed") statusColor = "hsla(150, 97.60%, 48.60%, 0.70)";
    else if (booking.status === "completed") statusColor = "green";
    else if (booking.status === "cancelled" || booking.status === "expired") statusColor = "red";

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${booking.stationName}</td>
        <td>${booking.chargerType}</td>
        <td>${booking.bookingTime ? new Date(booking.bookingTime).toLocaleString() : 'N/A'}</td>
        <td>${booking.vehicleType}</td>
        <td>${booking.slotNumbers.join(", ")}</td>
        <td style="color: ${statusColor}; font-weight: bold;">
          ${booking.status.toUpperCase()}
          ${booking.cancellationReason ? `<br><small>Reason: ${booking.cancellationReason}</small>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}
window.onload = loadActiveBookings;
