//Initialize Map
const map = L.map("map").setView([17.3850, 78.4867], 12); // Default to Hyderabad

//Add OpenStreetMap Layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

//Custom Icons for Stations
const defaultIcon = L.icon({
  iconUrl: "images/battery.png",
  iconSize: [30, 30],
});

const selectedIcon = L.icon({
  iconUrl: "images/battery_selected.png",
  iconSize: [45, 45],
});

//Fetch Stations from MongoDB and Display on Map
let stations = [];
let lastSelectedStation = null;

async function loadStations() {
  try {
    const response = await fetch("http://localhost:5000/stations/get-stations");
    stations = await response.json();

    stations.forEach((station) => {
      station.marker = L.marker([station.location.latitude, station.location.longitude], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(`
          <div class="station-popup">
            <button class="info-button" title="View station details" onclick="showStationDetails('${station.stationId}')">ℹ</button>
            <b class="station-name">${station.stationName}</b><br>
            <div class="button-container">
              <button class="popup-button navigate-button" onclick="navigateTo('${station.stationId}', ${station.location.latitude}, ${station.location.longitude})">Navigate</button>
              <button class="popup-button book-button" onclick="bookStation('${station.stationId}')">Book Now</button>
            </div>
          </div>
        `)
        .on("click", () => {
          selectStation(station);
          station.marker.openPopup(); // Ensure popup opens on selection
        });
    });
  } catch (error) {
    console.error("Error loading stations:", error);
  }
}
//Function to Change Selected Station Marker
function selectStation(station) {
  if (lastSelectedStation) {
    lastSelectedStation.marker.setIcon(defaultIcon);
  }

  station.marker.setIcon(selectedIcon);
  lastSelectedStation = station;
  map.setView([station.location.latitude, station.location.longitude], 15);

  //Save Selected Station in sessionStorage
  sessionStorage.setItem("selectedStation", JSON.stringify({
    stationId: station.stationId,
    stationName: station.stationName,
    latitude: station.location.latitude,
    longitude: station.location.longitude,
    address: station.address || "Not available",
    ownerPhone: station.ownerPhone || "Not available"
  }));

  console.log("Selected Station Saved:", station.stationName);
}
async function bookStation(stationId) {
  if (!stationId) {
      alert("Station ID is missing or invalid!");
      return;
  }

  try {
      // Fetch Station Details from Backend
      const [stationResponse, pointsResponse] = await Promise.all([
          fetch(`http://localhost:5000/stations/${stationId}/details`),
          fetch(`http://localhost:5000/stations/${stationId}/charging-points`)
      ]);

      if (!stationResponse.ok) throw new Error("Failed to fetch station details");
      if (!pointsResponse.ok) throw new Error("Failed to fetch charging points");

      const [stationData, chargingPoints] = await Promise.all([
          stationResponse.json(),
          pointsResponse.json()
      ]);

      // Create clean object without circular references
      const stationDetails = {
          ...JSON.parse(JSON.stringify(stationData)),
          chargingPoints: JSON.parse(JSON.stringify(chargingPoints))
      };

      // Store in sessionStorage
      sessionStorage.setItem("selectedStation", JSON.stringify(stationDetails));
      console.log("Stored Station Data:", stationDetails);

      // Redirect to Booking Page
      window.location.href = "/index_booking.html";
  } catch (error) {
      console.error("Error fetching station data:", error);
      alert("Failed to fetch station data. Please try again.");
  }
}



// Get User Location in Real-Time
let userMarker, userLat = null, userLng = null;
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      if (userMarker) {
        userMarker.setLatLng([userLat, userLng]);
      } else {
        userMarker = L.marker([userLat, userLng], {
          icon: L.icon({
            iconUrl: "images/my_location.png",
            iconSize: [25, 25],
          }),
        })
          .addTo(map)
          .bindPopup("Your Location")
          .openPopup();
      }
    },
    (error) => {
      console.error("Geolocation Error:", error);
      alert("Location access denied. Enable GPS for accuracy.");
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );
} else {
  alert("Geolocation is not supported by this browser.");
}

//Function to Find Nearest Station
document.getElementById("find-nearest").addEventListener("click", function () {
  if (!userLat || !userLng) {
    alert("Location not available. Please enable GPS.");
    return;
  }

  let nearestStation = stations.reduce((prev, curr) => {
    let prevDist = getDistance(userLat, userLng, prev.location.latitude, prev.location.longitude);
    let currDist = getDistance(userLat, userLng, curr.location.latitude, curr.location.longitude);
    return currDist < prevDist ? curr : prev;
  });

  selectStation(nearestStation);
});

//Initialize Routing Control
let routingControl = null;
function initializeRoutingControl() {
  routingControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    showAlternatives: true,
    createMarker: function (i, waypoint, n) {
      if (i === 1) return null; 
      return L.marker(waypoint.latLng, {
        icon: i === 0 ? userMarker.options.icon : selectedIcon,
      }).bindPopup(i === 0 ? "You are here" : "");
    },
    lineOptions: {
      styles: [
        { color: "#007bff", weight: 6, opacity: 0.8 },
        { color: "#ffffff", weight: 3, opacity: 0.5, dashArray: "5, 10" },
      ],
    },
  }).addTo(map);
}
initializeRoutingControl();

//Function to Update Waypoints When Navigating
function navigateTo(stationId, lat, lng) {
  if (!userLat || !userLng) {
    alert("Location not available. Please enable GPS.");
    return;
  }
  console.log(`Navigating to Station ID: ${stationId}, Latitude: ${lat}, Longitude: ${lng}`);

  //Clear previous route before setting a new one
  if (routingControl) {
    routingControl.setWaypoints([
      L.latLng(userLat, userLng),
      L.latLng(lat, lng),
    ]);
  }

  // Ensure the selected station is set correctly
  let selectedStation = stations.find(s => s.stationId === stationId);
  if (!selectedStation) {
    alert("Selected station not found!");
    return;
  }

  selectStation(selectedStation);
}

//Function to Search for a Station
const searchBox = document.getElementById("search-box");
const searchBtn = document.getElementById("search-btn");

function searchStation() {
  let query = searchBox.value.toLowerCase().trim();
  if (!query) {
    alert("Please enter a station name.");
    return;
  }

  let foundStation = stations.find((station) =>
    station.stationName.toLowerCase().includes(query)
  );

  if (foundStation) {
    selectStation(foundStation);
  } else {
    alert("No matching station found!");
  }
}

//Search Button & Enter Key Event Listeners
searchBtn.addEventListener("click", searchStation);
searchBox.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    searchStation();
  }
});

//Haversine Formula to Calculate Distance
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
loadStations();