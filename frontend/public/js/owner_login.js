// Handle owner login form submission
document.getElementById('ownerLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get input values
    const stationId = document.getElementById('stationId').value;
    const stationPassword = document.getElementById('stationPassword').value;

    // Clear previous error messages
    const errorElement = document.getElementById('passwordError');
    errorElement.textContent = '';
    
    try {
        // Send login request to server
        const response = await fetch('/owner/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stationId, stationPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store authentication token and station details in localStorage
        localStorage.setItem('ownerToken', data.token);
        localStorage.setItem('stationId', data.stationId);
        localStorage.setItem('stationName', data.stationName);
        
        // Redirect to owner dashboard
        window.location.href = 'owner_dashboard.html';
        
    } catch (error) {
        // Display login error to user
        errorElement.textContent = error.message;
    }
});
