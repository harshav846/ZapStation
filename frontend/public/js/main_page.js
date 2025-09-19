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
            window.location.href = "/index.html";
        });
    }

    //Only init slider if elements exist
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
    if (localStorage.getItem("isGuest") === "true") {
        disableGuestFeatures();
    }
});
// Check guest status on page load and disable restricted features
document.addEventListener("DOMContentLoaded", function() {
    
    if (localStorage.getItem("isGuest") === "true") {
        disableGuestFeatures();
    }
});
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