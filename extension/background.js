// Define replacement URLs
const replaceUrls = [
    "https://www.youtube.com/watch?v=cY2G3dhW8qc",
    "https://www.youtube.com/watch?v=2A8OqL-nHT8",
    "https://www.youtube.com/watch?v=txqiwrbYGrs",
    "https://www.youtube.com/watch?v=ciOFpMapc6o",
    "https://www.youtube.com/watch?v=k3wWF6pQgpE",
    "https://www.youtube.com/watch?v=lx3egn8v4Mg",
    "https://www.youtube.com/watch?v=b6hoBp7Hk-A",
    "https://www.youtube.com/watch?v=QQ9gs-5lRKc",
    "https://www.youtube.com/watch?v=d7qqu9HC7V0",
    "https://www.youtube.com/watch?v=fLclGPr7fj4",
    "https://www.youtube.com/watch?v=a91oTLx-1No"
];

// Function to get a random URL
function getRandomURL() {
    const randomIndex = Math.floor(Math.random() * replaceUrls.length);
    return replaceUrls[randomIndex];
}

// Function to generate well-distributed random timestamps
function generateRandomTimestamps(count) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const timestamps = [];
    
    // Generate timestamps and ensure they're well-distributed
    for (let i = 0; i < count; i++) {
        // Get a random number of minutes since midnight
        const randomMinutes = Math.floor(Math.random() * 1440); // 1440 minutes in a day
        const timestamp = new Date(todayStart);
        timestamp.setMinutes(randomMinutes);
        timestamps.push(timestamp.getTime());
    }
    
    // Sort timestamps to maintain chronological order
    timestamps.sort((a, b) => a - b);
    return timestamps;
}

// Add URLs to history with random timestamps
async function addUrlsToHistory() {
    console.log("Adding replacement URLs to history with random timestamps");
    
    try {
        // Generate random timestamps for all URLs
        const timestamps = generateRandomTimestamps(replaceUrls.length);
        
        // Add each URL from replaceUrls to history
        for (let i = 0; i < replaceUrls.length; i++) {
            const url = replaceUrls[i];
            const timestamp = timestamps[i];
            
            try {
                // First add the URL
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent rate limiting
                await chrome.history.addUrl({ url });
                
                // Then set the visit time
                await chrome.history.addVisit({
                    url,
                    visitTime: timestamp,
                    transition: chrome.history.TransitionType.LINK,
                    qualifyingItems: []
                });
                
                console.log("Added to history:", url, "at time:", new Date(timestamp).toLocaleString());
            } catch (error) {
                console.error("Error adding URL to history:", url, error);
            }
        }
        console.log("Finished adding URLs to history");
    } catch (error) {
        console.error("Error in adding URLs to history:", error);
        throw error;
    }
}

// Handle history deletion
async function handleHistoryDeletion() {
    console.log("Starting history deletion for last 500 items");
    
    try {
        const results = await chrome.history.search({
            text: '', // Empty string to match all URLs
            startTime: 0, // From beginning of time
            maxResults: 500
        });
        
        console.log(`Found ${results.length} history entries to delete`);
        
        // Delete existing history
        for (const item of results) {
            try {
                await chrome.history.deleteUrl({ url: item.url });
                console.log("Deleted history entry:", item.url);
            } catch (error) {
                console.error("Error deleting URL:", item.url, error);
            }
        }

        // Add replacement URLs to history with random timestamps
        await addUrlsToHistory();
        
        return { success: true, deletedCount: results.length };
    } catch (error) {
        console.error("Error in history deletion:", error);
        throw error;
    }
}

// Handle tab replacement
async function handleTabReplacement(domain) {
    console.log("Starting tab replacement for domain:", domain);
    
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        console.log(`Found ${tabs.length} tabs to process`);
        
        for (const tab of tabs) {
            try {
                if (new URL(tab.url).hostname === domain) {
                    const newUrl = getRandomURL();
                    await chrome.tabs.update(tab.id, { url: newUrl });
                    console.log("Updated tab", tab.id, "to:", newUrl);
                }
            } catch (error) {
                console.error("Error processing tab:", tab.id, error);
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error in tab replacement:", error);
        throw error;
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request);
    
    if (request.action === "deleteHistory") {
        handleHistoryDeletion()
            .then(result => sendResponse(result))
            .catch(error => {
                console.error("History deletion error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    if (request.action === "replaceTabs") {
        handleTabReplacement(request.domain)
            .then(result => sendResponse(result))
            .catch(error => {
                console.error("Tab replacement error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});