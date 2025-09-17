document.addEventListener("DOMContentLoaded", function () {
    let currentIndex = 0;
    const images = document.querySelectorAll('.slider-image'); 
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("authToken");
            localStorage.removeItem("isGuest");
            localStorage.removeItem("guestLimits");
            sessionStorage.removeItem("userData");

            alert("You have been logged out!");
            window.location.href = "/index_login.html";
        });
    }

    // ✅ Only init slider if elements exist
    if (images.length > 0 && prevButton && nextButton) {
        function updateSlider() {
            images.forEach((image, index) => {
                image.classList.toggle('active', index === currentIndex);
            });
        }

        prevButton.addEventListener('click', () => {
            showLoader();
            setTimeout(() => {
                currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
                updateSlider();
                hideLoader();
            }, 300);
        });

        nextButton.addEventListener('click', () => {
            showLoader();
            setTimeout(() => {
                currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
                updateSlider();
                hideLoader();
            }, 300);
        });

        updateSlider();
        hideLoader();
    }

    // ✅ Guest mode
    showGuestIndicators();
    if (localStorage.getItem("isGuest") === "true") {
        disableGuestFeatures();
    }
});

// Show guest banner and handle guest mode
function showGuestIndicators() {
    const isGuest = localStorage.getItem("isGuest") === "true";
    
    if (isGuest) {
        showLoader();
        setTimeout(() => {
            const guestBanner = document.createElement('div');
            guestBanner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(45deg, #ff6b35, #f7931e);
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            guestBanner.innerHTML = `
                🎯 Guest Mode - Limited functionality | 
                <a href="/index_register_otp.html" style="color: white; text-decoration: underline;">
                    Sign up for full access
                </a>
                <button onclick="this.parentElement.remove()" style="margin-left: 20px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 10px; border-radius: 3px;">×</button>
            `;
            document.body.prepend(guestBanner);
            hideLoader();
        }, 300); // small delay for loader
    }
}

// Check guest status on page load and disable restricted features
document.addEventListener("DOMContentLoaded", function() {
    showGuestIndicators();
    
    if (localStorage.getItem("isGuest") === "true") {
        disableGuestFeatures();
    }
});

// Remove or disable premium features for guest users
function disableGuestFeatures() {
    const premiumFeatures = [
        '.premium-feature',
        '#export-btn',
        '#delete-account'
    ];
    
    premiumFeatures.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    });
}
