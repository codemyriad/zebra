import { getConversationHistory } from "../lib/chatgpt"

console.log("Zebra Content Script loaded for ChatGPT.");

// Example: Send a message to the background script
chrome.runtime.sendMessage({ greeting: "hello from chatgpt content script" }, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Error sending message from chatgpt.ts:", chrome.runtime.lastError.message);
  } else {
    console.log("Response from background:", response);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_conversation_history") {
    getConversationHistory().then((res) => {
      sendResponse({ status: "success", data: res });
    }).catch((error) => {
      sendResponse({ status: "error", error: error.message });
    });
    return true; // Indicate that the response will be sent asynchronously
  }
})
