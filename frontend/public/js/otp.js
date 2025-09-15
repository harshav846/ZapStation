document.addEventListener("DOMContentLoaded", () => {
    const mobileInput = document.getElementById("mobile-number");
    const sendOTPButton = document.getElementById("send-otp");
    const otpSection = document.getElementById("otp-section");
    const otpInput = document.getElementById("otp-input");
    const verifyOTPButton = document.getElementById("verify-otp");
    const otpMessage = document.getElementById("otp-message");

    let userMobile = ""; // Store the mobile number to verify

    // -------------------------
    // Send OTP
    // -------------------------
    sendOTPButton.addEventListener("click", async () => {
        userMobile = mobileInput.value.trim();

        // Validate mobile number
        if (!/^\d{10}$/.test(userMobile)) {
            otpMessage.textContent = "Enter a valid 10-digit mobile number!";
            otpMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch("https://zapstation.onrender.com/otp/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: userMobile })
            });

            const data = await response.json();

            if (response.ok) {
                otpMessage.textContent = data.message;
                otpMessage.style.color = "green";
                otpSection.style.display = "block"; // Show OTP input section
            } else {
                otpMessage.textContent = data.error || "Failed to send OTP.";
                otpMessage.style.color = "red";
            }
        } catch {
            otpMessage.textContent = "Network error! Please check your connection.";
            otpMessage.style.color = "red";
        }
    });

    // -------------------------
    // Verify OTP
    // -------------------------
    verifyOTPButton.addEventListener("click", async () => {
        const otp = otpInput.value.trim();

        // Validate OTP
        if (!/^\d{6}$/.test(otp)) {
            otpMessage.textContent = "Enter a valid 6-digit OTP!";
            otpMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch("https://zapstation.onrender.com/otp/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: userMobile, otp })
            });

            const data = await response.json();

            if (response.ok) {
                otpMessage.textContent = data.message;
                otpMessage.style.color = "green";

                // Store verified mobile number
                sessionStorage.setItem("verifiedMobile", userMobile);

                // Redirect based on whether user exists
                if (data.userExists) window.location.href = "/index_main.html";
                else window.location.href = "/index_registration.html";
            } else {
                otpMessage.textContent = data.error || "OTP verification failed.";
                otpMessage.style.color = "red";
            }
        } catch {
            otpMessage.textContent = "Network error! Please try again.";
            otpMessage.style.color = "red";
        }
    });
});
