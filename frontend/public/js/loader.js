window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = "none";
    }
});

// Reusable loader functions for API calls
function showLoader() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
}
