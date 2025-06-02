import { getConversationHistory as getConversationHistoryFromChatGPT } from "../lib/chatgpt";
import { getConversationHistory as getConversationHistoryFromDeepseek } from "../lib/deepseek";

import { addNewConversationsAndRefresh } from "../lib/state/conversations.svelte";

// Import SQLite functions
import {
  initSqlite,
  saveConversation,
  getConversations,
  getConversation,
  deleteConversation,
  executeQuery,
} from "../lib/sqlite/sqlite-handler";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

console.log("Zebra Background Service Worker Started.");

// Global database connection
let sqliteDb = null;
let creatingOffscreenDocument: Promise<void> | null = null;

// Add a global function to execute SQL queries from the console
(self as any).executeSQL = async (sql: string, params: any[] = []) => {
  if (!sqliteDb) {
    console.error("Database not initialized yet");
    return null;
  }
  try {
    const result = await executeQuery(sqliteDb, sql, params);
    console.log("Query result:", result);
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    return null;
  }
};
// Initialize SQLite when the service worker starts
async function initializeDatabase() {
  try {
    console.log("Starting SQLite initialization...");
    sqliteDb = await initSqlite();
    console.log("SQLite initialized successfully");
  } catch (error) {
    console.error("Failed to initialize SQLite:", error);
  }
}

// Start initialization
initializeDatabase();

async function hasOffscreenDocument(path: string): Promise<boolean> {
  const offscreenUrl = chrome.runtime.getURL(path);
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });
    return contexts.length > 0;
  } else {
    // Fallback for older Chrome versions (pre-116)
    // @ts-ignore
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
      if (client.url === offscreenUrl && client.type === "window") {
        // Offscreen documents are of type 'window'
        return true;
      }
    }
    return false;
  }
}

async function setupOffscreenDocument(path: string) {
  if (await hasOffscreenDocument(path)) {
    console.log("Background: Offscreen document already exists.");
    return;
  }

  if (creatingOffscreenDocument) {
    console.log("Background: Offscreen document creation already in progress.");
    await creatingOffscreenDocument;
    return;
  }

  console.log("Background: Creating offscreen document.");
  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification:
      "To handle SQLite database operations in a DOM environment for OPFS access.",
  });

  try {
    await creatingOffscreenDocument;
    console.log("Background: Offscreen document created successfully.");
  } catch (error) {
    console.error("Background: Error creating offscreen document:", error);
  } finally {
    creatingOffscreenDocument = null;
  }
}

// Ensure the offscreen document is set up when the service worker starts
// or when it's needed.
setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

chrome.action.onClicked.addListener(async () => {
  // This is an example action; you might use it to open your extension's UI
  // or for testing the offscreen document setup.
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
  console.log(
    "Background: Action clicked, ensured offscreen document is set up.",
  );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download_conversation_history_deepseek") {
    getConversationHistoryFromDeepseek(request.token)
      .then(async (res) => {
        await addNewConversationsAndRefresh(res);
        sendResponse({ status: "success", data: res });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });
  } else if (request.action === "download_conversation_history") {
    getConversationHistoryFromChatGPT()
      .then(async (res) => {
        await addNewConversationsAndRefresh(res);
        sendResponse({ status: "success", data: res });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });
  }
  return true; // Indicate that the response will be sent asynchronously
});
