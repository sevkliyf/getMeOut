chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received a message:", message);

    // Check if the message is of the correct type
    if (message.type === "HANDLE_HISTORY") {
        const { domains, safeContent, exitSite } = message;

        const domainsFixed = fixDomains(domains);
        const exitSiteClean = getCleanURL(exitSite);
        const exitSiteFixed = fixUrls(exitSiteClean);

        console.log("Domains to replace:", domainsFixed);
        console.log("Safe content types:", safeContent);
        console.log("Exit site:", exitSiteFixed);

        // Search the user's browsing history
        chrome.history.search({ text: "", maxResults: 500 }, (results) => {
            console.log("Browsing history fetched:", results);

            // Generate safe URLs for all content types
            const safeUrls = generateSafeUrls(safeContent, domains.length);
            console.log("Generated safe URLs:", safeUrls);

            results.forEach((item) => {
                // Check if the current URL matches a domain to replace
                if (domains.some((domain) => item.url.includes(domain))) {
                    console.log(`Deleting domain entry: ${item.url}`);
                    chrome.history.deleteUrl({ url: item.url });

                    // Replace with a safe URL
                    const safeUrl = safeUrls.pop() || exitSite || "https://www.google.com";
                    console.log(`Adding safe URL: ${safeUrl}`);
                    chrome.history.addUrl({ url: safeUrl });
                } 
                // Check if the URL is a Google search
                else if (isGoogleUrl(item.url)) {
                    console.log(`Deleting Google search: ${item.url}`);
                    chrome.history.deleteUrl({ url: item.url });
                }
            });

            // Redirect the user to the specified exit site
            const redirectUrl = exitSite || "https://www.google.com";
            if (sender && sender.tab) {
                console.log(`Redirecting tab ${sender.tab.id} to: ${redirectUrl}`);
                chrome.tabs.update(sender.tab.id, { url: redirectUrl });
            } else {
                console.error("Sender tab not found. Cannot redirect.");
            }

            sendResponse({ success: true });
        });

        // Indicate that the response will be sent asynchronously
        return true;
    } else {
        console.error("Unknown message type:", message.type);
        sendResponse({ success: false, error: "Invalid message type" });
    }
});

// Helper: Identify if a URL is a Google search or service
function isGoogleUrl(url) {
    const isGoogle = /^https:\/\/www\.google\.[a-z.]+/.test(url);
    console.log(`Checking if URL is Google-related (${url}):`, isGoogle);
    return isGoogle;
}

// Helper: Generate Safe URLs
function generateSafeUrls(contentTypes, count) {
    const safeContentMap = {
        news: [
            "https://www.bbc.com/live/news",
            "https://edition.cnn.com/world",
            "https://www.nytimes.com/section/world",
            "https://www.theguardian.com/world",
            "https://www.reuters.com/world",
            "https://www.aljazeera.com",
            "https://apnews.com/world-news",
            "https://www.dw.com/top-stories/s-9097",
            "https://news.sky.com/world",
            "https://www.cbc.ca/news"
        ],
        videos: [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com/watch?v=tpiyEe_CqB4",
            "https://www.youtube.com/watch?v=FfJOz5UX0sk"
        ],
        sports: [
            "https://www.espn.com/nfl",
            "https://www.cricbuzz.com/cricket-match/live-scores",
            "https://www.livescore.com"
        ],
        recipes: [
            "https://www.allrecipes.com/recipe/17481/simple-white-cake",
            "https://www.bbcgoodfood.com/recipes/lentil-soup",
            "https://www.loveandlemons.com/brownies-recipe"
        ],
        weather: [
            "https://weather.com",
            "https://www.weather.gov",
            "https://www.wunderground.com"
        ],
        shows: [
            "https://www.netflix.com/browse/genre/89814",
            "https://www.hulu.com/guides/category/featured",
            "https://www.hbo.com/whats-new-whats-leaving"
        ],
        music: [
            "https://open.spotify.com/track/4fGEj1YkKvY4KZiK8isuSg",
            "https://music.apple.com/ca/curator/best-playlists-ever/1494209940",
            "https://soundcloud.com/charts/top"
        ]
    };

    // Flatten and shuffle the URLs for randomness
    const allUrls = contentTypes.flatMap((type) => safeContentMap[type] || []);
    const shuffledUrls = shuffleArray(allUrls).slice(0, count);

    console.log("Safe URLs after shuffling:", shuffledUrls);
    return shuffledUrls;
}

// Helper: Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Cleans URL to then add protocalls to all them to make sure they all work.
function getCleanURL(url) {
    // Remove protocol (http://, https://)
    url = url.replace(/^https?:\/\//, "");
    
    // Remove "www."
    url = url.replace(/^www\./, "");
    
    // Remove trailing slash (if any)
    url = url.replace(/\/$/, "");

    return url;
}

function fixDomains(domains) {
    cleanedDomains = domains.map(url => getCleanURL(url));
    return domains.map(url => fixUrls(url));
}

function fixUrls(url) {
    return ("https://www." + url);
}