(function () {
    // Fetch configuration from the script tag
    const currentScript = document.currentScript;

    // Helper function to ensure the URL has a valid protocol
    function fixUrls(url) {
        if (!url || typeof url !== "string") {
            console.error("Invalid exitSite URL:", url);
            return "https://www.google.com"; // Default to a safe URL
        }
        // Add protocol if missing
        return url.startsWith("http") ? url : `https://${url}`;
    }

    const domains = currentScript.getAttribute("data-domains")?.split(",").map(d => d.trim()) || [];
    const safeContent = currentScript.getAttribute("data-safe-content")?.split(",").map(c => c.trim()) || [];
    let exitSite = currentScript.getAttribute("data-exit-site") || "https://www.google.com";

    // Normalize the exit site URL
    exitSite = fixUrls(exitSite);

    // Dynamically inject Bootstrap CSS and JS if not already present
    function injectBootstrap() {
        if (!document.querySelector('link[href*="bootstrap"]')) {
            const link = document.createElement("link");
            link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[src*="bootstrap.bundle.min.js"]')) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
            script.defer = true;
            document.body.appendChild(script);
        }
    }

    // Dynamically inject the modal HTML
    function injectModal() {
        const modalHTML = `
            <div class="modal fade" id="installExtensionModal" tabindex="-1" aria-labelledby="installExtensionLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="installExtensionLabel">Install QuickQuit Extension</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    Install the QuickQuit Chrome extension to enable enhanced security benefits. Would you like to install it now?
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No, thanks</button>
                    <a id="installExtensionButton" class="btn btn-primary" href="https://chrome.google.com/webstore/detail/bohobbkmlhibianbbejolcdncdigcchf" target="_blank">Install Now</a>
                  </div>
                </div>
              </div>
            </div>`;
        const div = document.createElement("div");
        div.innerHTML = modalHTML;
        document.body.appendChild(div);
    }

    // Function to show the modal if needed
    function showInstallPrompt() {
        const dismissed = localStorage.getItem("quickquitDismissed") === "true";
        const modal = new bootstrap.Modal(document.getElementById("installExtensionModal"));

        if (!dismissed) {
            modal.show();
            document.querySelector(".modal .btn-secondary").addEventListener("click", () => {
                localStorage.setItem("quickquitDismissed", "true");
            });
        }
    }

    // Check for extension detection
    function checkExtensionInstalled() {
        if (document.documentElement.getAttribute("data-quick-quit-extension") === "true") {
            console.log("QuickQuit extension detected!");
            return true;
        }
        console.log("QuickQuit extension not detected.");
        return false;
    }

    // Initialize everything on page load
    window.addEventListener("load", () => {
        injectBootstrap();
        injectModal();

        // Delay to ensure Bootstrap scripts are loaded
        setTimeout(() => {
            if (!checkExtensionInstalled()) {
                showInstallPrompt();
            }
        }, 500);
    });

    // Attach event listener to the button
    const button = document.getElementById("quickQuitButton");
    if (!button) {
        console.error("QuickQuit: No button with ID 'quickQuitButton' found.");
        return;
    }

    button.addEventListener("click", () => {
        // Send configuration to the extension
        window.postMessage(
            {
                type: "QUICK_QUIT_CONFIG",
                data: { domains, safeContent, exitSite }
            },
            "*"
        );

        // Redirect the user immediately to the validated exitSite
        setTimeout(() => {
            console.log("Redirecting to:", exitSite);
            window.location.href = exitSite;
        }, 100);
    });

    console.log("QuickQuit script loaded successfully.");
})();