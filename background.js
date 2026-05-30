// Check if `browser` API exists (Firefox), else use `chrome`
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Log when extension is installed
browserAPI.runtime.onInstalled.addListener(() => {
    console.log("Extension installed in both Chrome & Firefox!");
});
