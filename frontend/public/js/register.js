
document.addEventListener("DOMContentLoaded", () => {
    const mobileInput = document.getElementById("mobile-number");

    // Fill mobile number from sessionStorage if already verified
    const verifiedMobile = sessionStorage.getItem("verifiedMobile");
    if (verifiedMobile) {
        mobileInput.value = verifiedMobile;
        mobileInput.setAttribute("readonly", true); // Make input readonly
    }

    const registerForm = document.getElementById("register-form");

    // Handle registration form submission
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Get user inputs
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            alert("All fields are required!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // Send registration request to server
            const response = await fetch("https://zapstation.onrender.com/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, mobile: verifiedMobile, password, email })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = "/index_main.html"; // Redirect to main page
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Failed to register. Please try again.");
        }
    });
});
