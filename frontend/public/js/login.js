document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginInput = document.getElementById("login-input"); // Mobile or Email input
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("login-message");

    // Guest Login
    document.getElementById("guest-login")?.addEventListener("click", async () => {
        try {
            showLoader();
            const response = await fetch("https://zapstation.onrender.com/auth/guest/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            hideLoader();

            if (response.ok) {
                const userData = {
                    name: data.user.name,
                    mobile: data.user.mobile,
                    email: data.user.email,
                    isGuest: true
                };

                sessionStorage.setItem("userData", JSON.stringify(userData));
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("isGuest", "true");
                localStorage.setItem("guestLimits", JSON.stringify(data.guestLimits || {}));

                alert("Welcome Guest! You can explore with limited functionality.");
                window.location.href = data.redirect;
            } else {
                alert(data.error || "Guest login failed");
            }
        } catch (error) {
            hideLoader();
            console.error("Guest Login Error:", error);
            alert("Server error. Try again.");
        }
    });

    // Normal User Login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const loginValue = loginInput.value.trim();
        const password = passwordInput.value.trim();

        if (!loginValue || !password) {
            loginMessage.textContent = "Please enter Mobile/Email & Password.";
            loginMessage.style.color = "red";
            return;
        }

        try {
            showLoader();
            const response = await fetch("https://zapstation.onrender.com/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginInput: loginValue, password })
            });

            const data = await response.json();
            hideLoader();

            if (response.ok) {
                loginMessage.textContent = "Login successful! Redirecting...";
                loginMessage.style.color = "green";

                const userData = {
                    name: data.user.name,
                    mobile: data.user.mobile,
                    email: data.user.email,
                    isGuest: data.user.isGuest || false
                };
                sessionStorage.setItem("userData", JSON.stringify(userData));
                localStorage.setItem("authToken", data.token);

                if (data.user.isGuest) {
                    localStorage.setItem("isGuest", "true");
                    localStorage.setItem("guestLimits", JSON.stringify(data.guestLimits || {}));
                } else {
                    localStorage.removeItem("isGuest");
                }

                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                loginMessage.textContent = data.error || "Invalid credentials!";
                loginMessage.style.color = "red";
            }
        } catch (error) {
            hideLoader();
            console.error("Login Error:", error);
            loginMessage.textContent = "Server error. Try again.";
            loginMessage.style.color = "red";
        }
    });
});
