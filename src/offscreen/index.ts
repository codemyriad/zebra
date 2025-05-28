import {
  initSqlite,
  saveConversation,
  getConversations,
  getConversation,
  deleteConversation,
  executeQuery,
  type SqliteDb,
  saveConversations,
} from "../lib/sqlite/sqlite-handler";

let sqliteDb: SqliteDb | null = null;

// async function initializeDatabase() {
//   try {
//     console.log("Offscreen: Starting SQLite initialization...");
//     sqliteDb = await initSqlite();
//     if (sqliteDb) {
//       console.log("Offscreen: SQLite initialized successfully.");
//       // Log details about the connection to verify OPFS if possible
//       if (sqliteDb.promiser && sqliteDb.dbId) {
//         const config = await sqliteDb.promiser("config-get", {});
//         console.log("Offscreen: SQLite promiser config:", config);
//         const openParams = await sqliteDb.promiser("open-details", {
//           dbId: sqliteDb.dbId,
//         });
//         console.log("Offscreen: SQLite promiser open details:", openParams);
//       } else if (sqliteDb.db) {
//         console.log("Offscreen: Direct SQLite DB object initialized.");
//       }
//     } else {
//       console.error("Offscreen: SQLite initialization returned null.");
//     }
//   } catch (error) {
//     console.error("Offscreen: Failed to initialize SQLite:", error);
//   }
// }
//

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
async function initializeDatabase() {
  try {
    console.log("Starting SQLite initialization...");
    sqliteDb = await initSqlite();
    console.log("SQLite initialized successfully");
  } catch (error) {
    console.error("Failed to initialize SQLite:", error);
  }
}

// Initialize the database when the offscreen document loads
initializeDatabase();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Offscreen: Message received", request);

  if (!sqliteDb) {
    console.error(
      "Offscreen: SQLite not initialized or initialization failed.",
    );
    sendResponse({
      success: false,
      error: "Offscreen: SQLite not initialized",
    });
    return true; // Indicate async response
  }

  const operations: { [key: string]: (req: any) => Promise<any> } = {
    SAVE_CONVERSATION: async (req) => {
      const result = await saveConversation(sqliteDb!, req.conversation);
      return { result };
    },
    SAVE_CONVERSATIONS: async (req) => {
      const result = await saveConversations(sqliteDb!, req.conversations);
      return { result };
    },
    GET_CONVERSATIONS: async (req) => {
      const conversations = await getConversations(
        sqliteDb!,
        req.payload.limit,
        req.payload.offset,
      );
      return { conversations };
    },
    GET_CONVERSATION: async (req) => {
      const conversation = await getConversation(sqliteDb!, req.id);
      return { conversation };
    },
    DELETE_CONVERSATION: async (req) => {
      const result = await deleteConversation(sqliteDb!, req.id);
      return { result };
    },
    EXECUTE_QUERY: async (req) => {
      const result = await executeQuery(sqliteDb!, req.sql, req.params || []);
      return { result };
    },
  };

  if (request && request.type && operations[request.type]) {
    operations[request.type](request)
      .then((result) => {
        sendResponse({ success: true, ...result });
      })
      .catch((error) => {
        console.error(`Offscreen: Error processing ${request.type}:`, error);
        sendResponse({ success: false, error: error.message });
      });
  } else {
    console.warn("Offscreen: Unknown operation or malformed request", request);
    sendResponse({
      success: false,
      error: "Offscreen: Unknown or malformed operation",
    });
  }

  return true; // Indicate that the response will be sent asynchronously
});
