// register.js - Fixed & Clean Version
document.addEventListener("DOMContentLoaded", () => {
    const mobileInput = document.getElementById("mobile-number");
    const registerForm = document.getElementById("register-form");

    // Pre-fill verified mobile number if available
    const verifiedMobile = sessionStorage.getItem("verifiedMobile");
    if (verifiedMobile) {
        mobileInput.value = verifiedMobile;
        mobileInput.setAttribute("readonly", true);
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            alert("⚠️ All fields are required!");
            return;
        }

        if (password !== confirmPassword) {
            alert("⚠️ Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("https://zapstation.onrender.com/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    mobile: verifiedMobile,
                    password,
                    email
                })
            });

            const data = await response.json();

            if (response.ok && data.token && data.user) {
                sessionStorage.setItem("authToken", data.token);
                sessionStorage.setItem("userData", JSON.stringify(data.user));
                alert(data.message || " Registration successful!");
                window.location.href = data.redirect || "/index_main.html";
            } else {
                alert(data.error || "❌ Registration failed!");
            }
        } catch (error) {
            console.error("🚨 Registration Error:", error);
            alert("⚠️ Failed to register. Please try again.");
        }
    });
});
