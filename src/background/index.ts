console.log("Zebra Background Service Worker Started.");

// Example: Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);
  if (request.greeting === "hello from popup") {
    sendResponse({ farewell: "goodbye from background" });
  }
  // Indicate that the response will be sent asynchronously
  return true;
});

// Example: Initialize SQLite WASM or other background tasks
// import { initSqlite } from '../lib/sqlite/sqlite-handler';
// (async () => {
//   try {
//     const db = await initSqlite();
//     console.log("SQLite initialized in background", db);
//     // Perform database operations
//   } catch (error) {
//     console.error("Failed to initialize SQLite in background:", error);
//   }
// })();
