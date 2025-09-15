document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  const token = localStorage.getItem('ownerToken');
  const stationId = localStorage.getItem('stationId');
  if (!token || !stationId) {
      window.location.href = 'owner-login.html';
      return;
  }

  // Initialize UI elements and event listeners
  document.getElementById('station-name').textContent = localStorage.getItem('stationName') || '';
  document.getElementById('dashboard-tab').addEventListener('click', () => switchView('dashboard'));
  document.getElementById('bookings-tab').addEventListener('click', () => switchView('bookings'));
  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('status-filter').addEventListener('change', applyAllFilters);
  document.getElementById('reset-filters').addEventListener('click', () => {
      document.getElementById('status-filter').value = '';
      document.getElementById('all-date').value = '';
      loadAllBookings();
  });

  // Load today's bookings by default
  loadAllBookings();
  loadTodayBookings();
});

// Switch between dashboard and bookings views
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');
  if (view === 'bookings') loadAllBookings(); 
}

// Fetch and render today's bookings
async function loadTodayBookings() {
    try {
        const stationId = localStorage.getItem('stationId');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('all-date').value = today;

        const response = await fetch(`/bookings/owner/today?stationId=${stationId}`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load bookings');
        }

        let bookings = await response.json();

        // Sort bookings by latest first
        bookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

        renderBookings(bookings, 'today-bookings');
    } catch (error) {
        alert('Failed to load today\'s bookings: ' + error.message);
    }
}


// Fetch and render all bookings (default filter by current date)
async function loadAllBookings() {
  const stationId = localStorage.getItem('stationId'); 

  try {
    const response = await fetch(`/bookings/station/${stationId}`, {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`
      }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch bookings');
    }

    let bookings = await response.json();

    // Sort bookings: latest first
    bookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));

    renderBookings(bookings, 'all-bookings'); 
  } catch (error) {
    alert("Failed to load bookings: " + error.message);
  }
}



// Apply status and date filters for bookings
async function applyAllFilters() {
  const stationId = localStorage.getItem('stationId');
  const status = document.getElementById('status-filter').value;
  const date = document.getElementById('all-date').value;

  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (date) params.append("date", date);

  try {
    const response = await fetch(`/bookings/station/${stationId}?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ownerToken')}` }
    });

    if (!response.ok) throw new Error("Failed to fetch bookings");

    const bookings = await response.json();
    bookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime));
    renderBookings(bookings, 'all-bookings');
  } catch (error) {
    alert("Something went wrong while applying filters.");
  }
}

// Update booking status (completed or cancelled)
async function updateBookingStatus(bookingId, status) {
    try {
        if (!bookingId || bookingId === 'undefined' || bookingId === 'null') {
            throw new Error('Invalid booking ID');
        }

        const response = await fetch(`/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('ownerToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.details || `Failed to update status`);

        alert(`Booking marked as ${status}`);
        loadTodayBookings();
        if (document.getElementById('bookings-view').classList.contains('active')) applyAllFilters();
    } catch (error) {
        alert(`Failed to update booking: ${error.message}`);
    }
}

// Event delegation for verify and cancel buttons
document.addEventListener('click', async (e) => {
    try {
        if (e.target.closest('.verify-btn')) {
            const bookingId = e.target.closest('button')?.dataset?.id;
            if (!bookingId) { alert('Error: No booking ID found on button'); return; }
            await updateBookingStatus(bookingId, 'completed');
        }
        if (e.target.closest('.cancel-btn')) {
            const bookingId = e.target.closest('button')?.dataset?.id;
            if (!bookingId) { alert('Error: No booking ID found on button'); return; }
            await updateBookingStatus(bookingId, 'cancelled');
        }
    } catch (error) {}
});

// Render bookings table
function renderBookings(bookings, tableId) {
    const tbody = document.getElementById(tableId);
    tbody.innerHTML = bookings.map(booking => {
        const bookingId = booking._id || booking.id || 'N/A';
        const shortId = bookingId.toString().substring(18, 24);
        const userName = booking.userName || (booking.userId && booking.userId.name) || 'N/A';
        const userPhone = booking.userPhone || (booking.userId && booking.userId.phone) || 'N/A';
        const stationName = booking.stationName || 'N/A';
        const pointId = booking.pointId || 'N/A';
        const vehicleType = booking.vehicleType || 'N/A';
        const chargerType = booking.chargerType || 'N/A';
        const slotNumbers = Array.isArray(booking.slotNumbers) ? booking.slotNumbers.join(", ") : 'N/A';
        const bookingTime = booking.bookingTime ? new Date(booking.bookingTime).toLocaleString() : 'N/A';
        const bookingDate = booking.bookingTime ? new Date(booking.bookingTime).toLocaleDateString() : 'N/A';
        const duration = booking.duration || 0;
        const status = booking.status || 'unknown';
        const statusBadge = `<span class="status-badge badge-${status}">${formatStatus(status)}</span>`;
        const showActions = tableId === 'today-bookings';
        const actions = showActions && status === 'confirmed' ? `
            <button class="btn btn-sm btn-success action-btn verify-btn" data-id="${bookingId}">Verify</button>
            <button class="btn btn-sm btn-danger action-btn cancel-btn" data-id="${bookingId}">Cancel</button>
        ` : '';

        return `
            <tr>
                <td>${shortId}</td>
                ${tableId === 'all-bookings' ? `<td>${bookingDate}</td>` : ''}
                <td>${userName}<br><small>${userPhone}</small></td>
                <td>${stationName}<br><small>Point: ${pointId}</small></td>
                <td>${vehicleType}</td>
                <td>${chargerType}</td>
                <td>${formatTimeSlot(booking.slotNumbers)}</td>
                <td>${bookingTime}</td>
                <td>${duration} hr</td>
                <td>${statusBadge}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

// Format slot numbers into readable time range
function formatTimeSlot(slots) {
    if (!Array.isArray(slots) || slots.length === 0) return "No slots selected";

    const sortedSlots = slots.map(s => Number(s)).filter(s => !isNaN(s)).sort((a, b) => a - b);
    if (sortedSlots.length === 0) return "Invalid slots";

    const SLOT_DURATION = 30;
    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    const startTotalMinutes = (firstSlot - 1) * SLOT_DURATION;
    const endTotalMinutes = lastSlot * SLOT_DURATION;

    const startHours = Math.floor(startTotalMinutes / 60) % 24;
    const startMins = startTotalMinutes % 60;
    const endHours = Math.floor(endTotalMinutes / 60) % 24;
    const endMins = endTotalMinutes % 60;

    const formatTime = (hours, minutes) => {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(startHours, startMins)} - ${formatTime(endHours, endMins)}`;
}

// Format booking status for display
function formatStatus(status) {
  return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Logout and redirect to login
function logout() {
  localStorage.removeItem('ownerToken');
  localStorage.removeItem('stationId');
  localStorage.removeItem('stationName');
  window.location.href = 'owner_login.html';
}
