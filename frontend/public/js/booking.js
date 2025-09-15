// Global variables
let selectedStation = JSON.parse(sessionStorage.getItem("selectedStation")) || {};
let userData = JSON.parse(sessionStorage.getItem("userData"));
let selectedSlots = [];
let bookedSlots = [];

// Initialize page on load
document.addEventListener("DOMContentLoaded", async function () {
  if (!selectedStation.stationId) {
    alert("No station selected!");
    window.location.href = "/map.html";
    return;
  }

  // Fill station details
  document.getElementById("station").value = selectedStation.stationName || "Not Found";
  document.getElementById("stationAddress").value = selectedStation.address || "Not available";
  document.getElementById("stationOwner").value = selectedStation.ownerPhone || "Not available";

  // Fill user details
  if (userData) {
    document.getElementById("userName").value = userData.name || "Guest";
    document.getElementById("userPhone").value = userData.mobile || "Unknown";
  }

  // Load charging points from cache or API
  if (selectedStation.chargingPoints && selectedStation.chargingPoints.length > 0) {
    loadChargingPointsDropdown(selectedStation.chargingPoints);
  } else {
    await fetchChargingPoints(selectedStation.stationId);
  }
});

// Populate charging points dropdown
function loadChargingPointsDropdown(points) {
  let dropdown = document.getElementById("chargingPoint");
  dropdown.innerHTML = '<option value="">--Select Charging Point--</option>';

  points.forEach(point => {
    let option = document.createElement("option");
    option.value = point.pointId;
    option.textContent = `Point ${point.pointId} (${point.chargerType})`;
    option.dataset.vehicleTypes = point.vehicleType;
    dropdown.appendChild(option);
  });
}

// Fetch charging points from backend
async function fetchChargingPoints(stationId) {
  try {
    let response = await fetch(`https://zapstation.onrender.com/stations/${stationId}/charging-points`);
    if (!response.ok) throw new Error("Failed to fetch charging points");

    let points = await response.json();
    selectedStation.chargingPoints = points;
    sessionStorage.setItem("selectedStation", JSON.stringify(selectedStation));

    loadChargingPointsDropdown(points);
  } catch (error) {
    console.error("Error fetching charging points:", error);
  }
}

// Handle charging point selection
function handleChargingPointSelection() {
  const pointDropdown = document.getElementById("chargingPoint");
  const pointId = pointDropdown.value;

  if (!pointId) {
    document.getElementById("vehicleType").innerHTML = '<option value="">--Select Vehicle Type--</option>';
    return;
  }

  const selectedPoint = selectedStation.chargingPoints.find(p => p.pointId === pointId);
  if (!selectedPoint) return;

  document.getElementById("chargingType").value = selectedPoint.chargingType;
  document.getElementById("chargerType").value = selectedPoint.chargerType;

  // Load vehicle types
  let vehicleDropdown = document.getElementById("vehicleType");
  vehicleDropdown.innerHTML = '<option value="">--Select Vehicle Type--</option>';

  if (selectedPoint.vehicleType && Array.isArray(selectedPoint.vehicleType)) {
    selectedPoint.vehicleType.forEach(vehicle => {
      let option = document.createElement("option");
      option.value = vehicle;
      option.textContent = getVehicleTypeName(vehicle);
      vehicleDropdown.appendChild(option);
    });
  }

  // Fetch slots for this point
  fetchAvailableSlots(selectedStation.stationId, pointId);
}

// Convert vehicle type code to readable name
function getVehicleTypeName(code) {
  const vehicleTypes = {
    "2": "2-Wheeler",
    "3": "3-Wheeler", 
    "4": "4-Wheeler",
    "ALL": "All Vehicle Types",
    "Unknown": "Unknown Vehicle Type"
  };
  return vehicleTypes[code] || code;
}

// Fetch available slots for a station/point
async function fetchAvailableSlots(stationId, pointId) {
  try {
    let response = await fetch(`https://zapstation.onrender.com/stations/${stationId}/available-slots?pointId=${pointId}`);
    if (!response.ok) throw new Error("Failed to fetch available slots");

    let slotsData = await response.json();
    let slotContainer = document.getElementById("slot-container");
    slotContainer.innerHTML = '';

    if (!slotsData.availableSlots || slotsData.availableSlots.length === 0) {
      slotContainer.innerHTML = '<p class="no-slots">No slots available at this time</p>';
      return;
    }

    // Build slots dropdown UI
    slotContainer.innerHTML = `
      <button id="show-slots-btn" class="slot-dropdown-btn">
          Select Slots (1-4 continuous) ▼
      </button>
      <div id="selected-slots-display" class="selected-slots">No slots selected</div>
      <div id="slots-dropdown" class="slot-dropdown-content"></div>
    `;

    const dropdownContent = document.getElementById("slots-dropdown");

    slotsData.availableSlots.forEach(slot => {
      let slotOption = document.createElement("div");
      slotOption.className = "slot-option";
      slotOption.dataset.slotNumber = slot.slotNumber;

      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "slot";
      checkbox.id = `slot-${slot.slotNumber}`;
      checkbox.value = slot.slotNumber;

      let label = document.createElement("label");
      label.htmlFor = `slot-${slot.slotNumber}`;
      label.textContent = `Slot ${slot.slotNumber} (${slot.startTime} - ${slot.endTime})`;

      slotOption.appendChild(checkbox);
      slotOption.appendChild(label);
      dropdownContent.appendChild(slotOption);

      checkbox.addEventListener('change', function() {
        updateSelectedSlots(this);
      });
    });

    // Toggle dropdown
    document.getElementById("show-slots-btn").addEventListener('click', function(e) {
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
      this.innerHTML = dropdownContent.classList.contains("show") 
        ? "Select Slots (1-4 continuous) ▲" 
        : "Select Slots (1-4 continuous) ▼";
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#slot-container')) {
        dropdownContent.classList.remove("show");
        const btn = document.getElementById("show-slots-btn");
        if (btn) btn.innerHTML = "Select Slots (1-4 continuous) ▼";
      }
    });

  } catch (error) {
    console.error("Error fetching available slots:", error);
    document.getElementById("slot-container").innerHTML = '<p class="error">Error loading slots. Please try again.</p>';
  }
}

// Slot selection logic
function updateSelectedSlots(checkbox) {
  const slotNumber = parseInt(checkbox.value);

  if (checkbox.checked) {
    selectedSlots.push(slotNumber);
    selectedSlots.sort((a, b) => a - b);

    if (selectedSlots.length > 4) {
      checkbox.checked = false;
      selectedSlots = selectedSlots.filter(s => s !== slotNumber);
      alert("Maximum 4 slots allowed");
      return;
    }

    if (!areSlotsContinuous(selectedSlots)) {
      checkbox.checked = false;
      selectedSlots = selectedSlots.filter(s => s !== slotNumber);
      alert("Please select continuous slots");
      return;
    }
  } else {
    selectedSlots = selectedSlots.filter(s => s !== slotNumber);
  }

  updateSelectedSlotsDisplay();
}

// Ensure slots are continuous
function areSlotsContinuous(slots) {
  if (slots.length <= 1) return true;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i] !== slots[i - 1] + 1) return false;
  }
  return true;
}

// Update selected slots text
function updateSelectedSlotsDisplay() {
  const display = document.getElementById("selected-slots-display");
  if (!display) return;

  if (selectedSlots.length === 0) {
    display.innerHTML = "No slots selected";
    return;
  }

  display.innerHTML = `<strong>Selected Slots:</strong> ${selectedSlots.map(s => `Slot ${s}`).join(", ")}`;
}

// Book slot
async function bookSlot() {
    const pointId = document.getElementById("chargingPoint").value;
    const vehicleType = document.getElementById("vehicleType").value;
    const isGuest = localStorage.getItem("isGuest") === "true";

    if (isGuest) {
        try {
            const guestLimits = JSON.parse(localStorage.getItem("guestLimits") || '{"maxBookings":2}');
            const maxBookings = guestLimits.maxBookings || 2;
            const guestBookings = await checkGuestBookingCount();

            if (guestBookings >= maxBookings) {
                alert(`Guest accounts are limited to ${maxBookings} bookings per day. Please sign up for full access.`);
                return;
            }
        } catch (error) {
            // Ignore guest limit check errors
        }
    }

    if (selectedSlots.length === 0) {
        alert("Please select at least 1 slot");
        return;
    }
    if (!pointId) {
        alert("Please select a charging point");
        return;
    }
    if (!vehicleType) {
        alert("Please select your vehicle type");
        return;
    }

    const now = new Date();
    const bookingData = {
        stationId: selectedStation.stationId,
        stationName: selectedStation.stationName,
        pointId: pointId,
        userId: userData?.userId || "guest",
        userName: document.getElementById("userName").value,
        userPhone: document.getElementById("userPhone").value,
        vehicleType: vehicleType,
        chargerType: document.getElementById("chargerType").value,
        slots: selectedSlots,
        slotNumbers: selectedSlots,
        bookingTime: now.toISOString(),
        bookingDate: now.toISOString().split('T')[0],
        status: "confirmed",
        duration: selectedSlots.length * 0.5
    };

    try {
        const bookBtn = document.getElementById("bookBtn");
        bookBtn.disabled = true;
        bookBtn.textContent = "Processing...";

        const response = await fetch("https://zapstation.onrender.com/bookings/book-slot", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409 && result.conflictingSlots) {
                alert(`The following slots are already booked: ${result.conflictingSlots.join(", ")}`);
                fetchAvailableSlots(selectedStation.stationId, pointId);
            } else {
                alert(`Booking failed: ${result.message || "Unknown error"}`);
            }
            return;
        }

        sessionStorage.setItem("bookingConfirmation", JSON.stringify({
            ...result.data,
            bookingId: result.bookingId
        }));

        window.location.href = "/index_bookingconfirm.html";

    } catch (error) {
        alert(`Booking failed: ${error.message}`);
    } finally {
        const bookBtn = document.getElementById("bookBtn");
        if (bookBtn) {
            bookBtn.disabled = false;
            bookBtn.textContent = "Book Now";
        }
    }
}

// Check guest booking count from backend
async function checkGuestBookingCount() {
    try {
        const response = await fetch('/bookings/guest/count', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await response.json();
        return data.count || 0;
    } catch {
        return 0;
    }
}

// Event listeners
document.getElementById("bookBtn")?.addEventListener("click", bookSlot);
document.getElementById("chargingPoint").addEventListener('change', handleChargingPointSelection);
