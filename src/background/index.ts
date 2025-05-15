console.log("Zebra Background Service Worker Started.");

// Import SQLite functions
import {
  initSqlite,
  saveConversation,
  getConversations,
  getConversation,
  deleteConversation,
  executeQuery,
} from "../lib/sqlite/sqlite-handler";

// Global database connection
let sqliteDb = null;

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

// Message handler for different operations
function handleDbOperation(operation, request, sendResponse) {
  if (!sqliteDb) {
    console.error("SQLite not initialized");
    sendResponse({ success: false, error: "SQLite not initialized" });
    return;
  }

  operation(request)
    .then((result) => sendResponse({ success: true, ...result }))
    .catch((error) => {
      console.error(`Error: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background:", request);

  const operations = {
    SAVE_CONVERSATION: async (req) => {
      const result = await saveConversation(sqliteDb, req.conversation);
      return { result };
    },
    GET_CONVERSATIONS: async () => {
      const conversations = await getConversations(sqliteDb);
      console.log({ conversations });
      return { conversations };
    },
    GET_CONVERSATION: async (req) => {
      const conversation = await getConversation(sqliteDb, req.id);
      return { conversation };
    },
    DELETE_CONVERSATION: async (req) => {
      const result = await deleteConversation(sqliteDb, req.id);
      return { result };
    },
    EXECUTE_QUERY: async (req) => {
      const result = await executeQuery(sqliteDb, req.sql, req.params || []);
      return { result };
    },
  };

  if (request.greeting === "hello from popup") {
    sendResponse({ farewell: "goodbye from background" });
  } else if (operations[request.type]) {
    handleDbOperation(operations[request.type], request, sendResponse);
  } else {
    sendResponse({ success: false, error: "Unknown operation" });
  }

  // Indicate that the response will be sent asynchronously
  return true;
});
