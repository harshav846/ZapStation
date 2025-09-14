document.addEventListener("DOMContentLoaded", function () {
    let currentIndex = 0;
    const images = document.querySelectorAll('.slider-image'); 
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');

    // Check if slider elements exist
    if (images.length === 0 || !prevButton || !nextButton) {
        console.error("Error: Slider elements not found. Check your HTML structure.");
        return;
    }

    // Update slider to show current image
    function updateSlider() {
        images.forEach((image, index) => {
            image.classList.toggle('active', index === currentIndex);
        });
    }

    // Navigate to previous image
    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
        updateSlider();
    });

    // Navigate to next image
    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
        updateSlider();
    });

    updateSlider(); // Initialize the slider
});

// Show guest banner and handle guest mode
function showGuestIndicators() {
    const isGuest = localStorage.getItem("isGuest") === "true";
    
    if (isGuest) {
        // Add guest banner at the top of the page
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
