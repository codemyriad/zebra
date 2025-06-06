console.log("Zebra Content Script loaded for DeepSeek.");

// Example: Send a message to the background script
chrome.runtime.sendMessage(
  { target: "background",
    greeting: "hello from deepseek content script" },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error sending message from deepseek.ts:",
        chrome.runtime.lastError.message,
      );
    } else {
      console.log("Response from background:", response);
    }
  },
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_localStorage_token" && request.key) {
    const tokenValue = localStorage.getItem(request.key);

    sendResponse({ token: tokenValue });
    // It's good practice to return true if sendResponse might be called asynchronously,
    // but localStorage.getItem is synchronous. However, to be safe and consistent:
    return true;
  }
});
