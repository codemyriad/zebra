console.log("Zebra Content Script loaded for Claude.ai.");

// Example: Send a message to the background script
chrome.runtime.sendMessage({ greeting: "hello from claude content script" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Error sending message from claude.ts:", chrome.runtime.lastError.message);
  } else {
    console.log("Response from background:", response);
  }
});

// TODO: Add logic to interact with Claude.ai's DOM
// e.g., identify conversation elements, cache them, etc.
