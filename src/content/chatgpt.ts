import { getConversationHistory } from "../lib/chatgpt";

console.log("Zebra Content Script loaded for ChatGPT.");

// Example: Send a message to the background script
chrome.runtime.sendMessage(
  { target: "background",
    greeting: "hello from chatgpt content script" },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error sending message from chatgpt.ts:",
        chrome.runtime.lastError.message,
      );
    } else {
      console.log("Response from background:", response);
    }
  },
);
