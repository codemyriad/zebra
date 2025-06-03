import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { Conversation } from "../types/content";

// Database interface for our application
export interface SqliteDb {
  promiser?: any;
  dbId?: string;
  db?: any;
}

// Schema definition
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT PRIMARY KEY,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    "url" TEXT,
    "meta" TEXT,
    "tags" TEXT,
    "content" TEXT NOT NULL
  );

CREATE TABLE IF NOT EXISTS "images"(
"filename" TEXT PRIMARY KEY,
"data" BLOB NOT NULL
);

-- Create the FTS5 virtual table for searching title and content
CREATE VIRTUAL TABLE IF NOT EXISTS "conversations_fts_idx" USING fts5(
rowid_original_conversations, -- Stores the ID from the 'conversations' table
title,
content,
tokenize='porter' -- Optional: 'porter' stemmer for better search results
);

-- Trigger to insert into FTS table when a new conversation is added
CREATE TRIGGER IF NOT EXISTS conversations_ai AFTER INSERT ON conversations
BEGIN
INSERT INTO conversations_fts_idx (rowid_original_conversations, title,
content)
VALUES (new.id, new.title, new.content);
END;

-- Trigger to delete from FTS table when a conversation is deleted
CREATE TRIGGER IF NOT EXISTS conversations_ad AFTER DELETE ON conversations
BEGIN
DELETE FROM conversations_fts_idx WHERE rowid_original_conversations =
old.id;
END;

-- Trigger to update FTS table when a conversation is updated
CREATE TRIGGER IF NOT EXISTS conversations_au AFTER UPDATE ON conversations
BEGIN
UPDATE conversations_fts_idx
SET title = new.title, content = new.content
WHERE rowid_original_conversations = old.id;
END;


  CREATE INDEX IF NOT EXISTS "conversations_index_0"
  ON "conversations" ("source", "title", "created_at");

  -- Trigger for INSERT
  CREATE TRIGGER IF NOT EXISTS ensure_content_json_insert
  BEFORE INSERT ON conversations
  FOR EACH ROW
  WHEN json_valid(NEW.content, 6) <> 1
  BEGIN
    SELECT RAISE(ABORT, 'content must be valid JSON');
  END;

  -- Trigger for UPDATE of content
  CREATE TRIGGER IF NOT EXISTS ensure_content_json_update
  BEFORE UPDATE OF content ON conversations
  FOR EACH ROW
  WHEN json_valid(NEW.content, 6) <> 1
  BEGIN
    SELECT RAISE(ABORT, 'content must be valid JSON');
  END;
`;

// Check if we're in a service worker context
const isServiceWorker = typeof self !== "undefined" && !self.window;

if (
  globalThis.location &&
  globalThis.location.pathname.endsWith("/offscreen.html")
) {
  // This code is running in the offscreen document
  console.log("Running in offscreen.html");
}
// Initialize SQLite with OPFS support
export async function initSqlite(): Promise<SqliteDb | null> {
  console.log("Initializing SQLite WASM...");

  try {
    if (isServiceWorker) {
      console.log("Initializing sqlite in service worker");
      return await initDirectSqlite();
    } else {
      console.log("Initializing sqlite in separate worker");
      return await initWorkerSqlite();
    }
  } catch (error) {
    console.error("Failed to initialize SQLite:", error);
    return null;
  }
}

// Initialize SQLite directly (for service workers)
async function initDirectSqlite(): Promise<SqliteDb | null> {
  console.log("Using direct SQLite initialization");
  const sqlite3 = await sqlite3InitModule({
    locateFile: (file: string) => chrome.runtime.getURL(`wasm/${file}`),
  });

  console.log("SQLite version:", sqlite3.version.libVersion);

  try {
    // Check if OPFS is available
    if (sqlite3.capi.sqlite3_vfs_find("opfs")) {
      console.log("... OPFS VFS is available ...");
    }
    const db =
      "opfs" in sqlite3
        ? new sqlite3.oo1.OpfsDb("/conversations.db")
        : new sqlite3.oo1.DB("/conversations.db", "ct");

    console.log(
      "OPFS is " + ("opfs" in sqlite3 ? "available" : "not available"),
    );

    // Create tables
    db.exec(SCHEMA);
    console.log("Database tables initialized");
    return { db };
  } catch (error) {
    console.error("Error initializing database:", error);
    return null;
  }
}

// Initialize SQLite with worker (for non-service worker contexts)
async function initWorkerSqlite(): Promise<SqliteDb | null> {
  console.log("Using worker-based SQLite initialization");
  // Import dynamically to avoid Worker reference in service worker
  const { sqlite3Worker1Promiser } = await import("@sqlite.org/sqlite-wasm");

  // Create a promiser that communicates with the SQLite worker
  const promiser = await new Promise<any>((resolve) => {
    const _promiser = sqlite3Worker1Promiser({
      onready: () => resolve(_promiser),
      workerPath: chrome.runtime.getURL("wasm/sqlite3-worker1.js"),
      wasmPath: chrome.runtime.getURL("wasm/sqlite3.wasm"),
    });
  });

  console.log("SQLite worker promiser ready");

  // Get SQLite configuration
  const configResponse = await promiser("config-get", {});
  console.log("SQLite version:", configResponse.result.version.libVersion);

  // Open a database with OPFS for persistence
  const dbResponse = await promiser("open", {
    filename: "file:conversations.db?vfs=opfs",
    flags: "c", // Create if it doesn't exist
  });

  const { dbId } = dbResponse;
  console.log("Database opened with ID:", dbId);

  // Create tables
  await promiser("exec", { dbId, sql: SCHEMA });
  console.log("Database tables initialized");

  return { promiser, dbId };
}

// Execute a database operation with transaction support
async function executeWithTransaction(
  db: SqliteDb,
  operation: (exec: (sql: string, params?: any[]) => any) => Promise<void>,
): Promise<boolean> {
  const exec = db.db
    ? (sql: string, params: any[] = []) => db.db.exec({ sql, bind: params })
    : async (sql: string, params: any[] = []) =>
        await db.promiser("exec", {
          dbId: db.dbId,
          sql,
          bind: params,
        });

  try {
    await exec("BEGIN TRANSACTION;");
    await operation(exec);
    await exec("COMMIT;");
    return true;
  } catch (error) {
    console.error("Database operation error:", error);
    try {
      await exec("ROLLBACK;");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    return false;
  }
}

// Save a conversation to the database
export async function saveConversation(
  db: SqliteDb,
  conversation: any,
): Promise<boolean> {
  // Prepare content from messages if needed
  let content = conversation.content;
  if (!content && conversation.messages) {
    // content = conversation.messages
    //   .map((msg: any) => `${msg.author}: ${msg.content}`)
    //   .join("\n\n");
    content = JSON.stringify(conversation.messages);
  }

  return executeWithTransaction(db, async (exec) => {
    await exec(
      `
      INSERT OR REPLACE INTO conversations (
        id, source, title, created_at, updated_at,
        url, meta, tags, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
      [
        conversation.id,
        conversation.source,
        conversation.title,
        conversation.created_at,
        conversation.updated_at,
        conversation.url || null,
        conversation.meta || null,
        conversation.tags || null,
        content,
      ],
    );
  });
}

export async function saveConversations(
  db: SqliteDb,
  conversations: Conversation[],
): Promise<boolean> {
  return executeWithTransaction(db, async (exec) => {
    for (const conversation of conversations) {
      // Prepare content from messages if needed
      let content = conversation.content;
      if (!content && conversation.messages) {
        // content = conversation.messages
        //   .map((msg: any) => `${msg.author}: ${msg.content}`)
        //   .join("\n\n");
        content = JSON.stringify(conversation.messages);
      }

      await exec(
        `
      INSERT OR REPLACE INTO conversations (
        id, source, title, created_at, updated_at,
        url, meta, tags, content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
        [
          conversation.id,
          conversation.source,
          conversation.title,
          conversation.created_at,
          conversation.updated_at,
          conversation.url || null,
          conversation.meta || null,
          conversation.tags || null,
          content,
        ],
      );
    }
  });
}

// Get conversations from the database
export async function getConversations(
  db: SqliteDb,
  limit: number,
  offset: number,
  source?: string,
): Promise<any[]> {
  try {
    let rows;

    let sql = `
      SELECT id, source, title, created_at, updated_at, url, meta, tags, content
      FROM conversations
    `;

    const params: any[] = [];
    const whereClauses: string[] = [];

    if (source && source !== "all") {
      whereClauses.push("source = ?");
      params.push(source);
    }

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += `
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?;
  `;
    params.push(limit, offset);
    if (db.db) {
      rows = db.db.exec({
        sql,
        bind: params,
        returnValue: "resultRows",
      });
    } else if (db.promiser && db.dbId) {
      rows = await db.promiser("exec", {
        dbId: db.dbId,
        sql,
        bind: params,
        returnValue: "resultRows",
      });
    } else {
      throw new Error("Invalid database connection");
    }

    return rows.result.resultRows.map((row: any) => ({
      id: row[0],
      source: row[1],
      title: row[2],
      created_at: row[3],
      updated_at: row[4],
      url: row[5],
      meta: row[6],
      tags: row[7],
      messages: JSON.parse(row[8]),
    }));
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
}

// Get a single conversation with its content
export async function getConversation(
  db: SqliteDb,
  conversationId: string,
): Promise<any | null> {
  try {
    let rows;

    if (db.db) {
      rows = db.db.exec({
        sql: "SELECT * FROM conversations WHERE id = ?;",
        bind: [conversationId],
        returnValue: "resultRows",
      });
    } else if (db.promiser && db.dbId) {
      rows = await db.promiser("exec", {
        dbId: db.dbId,
        sql: "SELECT * FROM conversations WHERE id = ?;",
        bind: [conversationId],
        returnValue: "resultRows",
      });
    } else {
      throw new Error("Invalid database connection");
    }

    if (!rows || !rows.length) return null;

    return {
      id: rows[0][0],
      source: rows[0][1],
      title: rows[0][2],
      created_at: rows[0][3],
      updated_at: rows[0][4],
      url: rows[0][5],
      meta: rows[0][6],
      tags: rows[0][7],
      content: rows[0][8],
    };
  } catch (error) {
    console.error("Error getting conversation:", error);
    return null;
  }
}

// Delete a conversation
export async function deleteConversation(
  db: SqliteDb,
  conversationId: string,
): Promise<boolean> {
  return executeWithTransaction(db, async (exec) => {
    await exec("DELETE FROM conversations WHERE id = ?;", [conversationId]);
  });
}

// Execute arbitrary SQL query
export async function executeQuery(
  db: SqliteDb,
  sql: string,
  params: any[] = [],
): Promise<any> {
  try {
    if (db.db) {
      return db.db.exec({
        sql,
        bind: params,
        returnValue: "resultRows",
      });
    } else if (db.promiser && db.dbId) {
      return await db.promiser("exec", {
        dbId: db.dbId,
        sql,
        bind: params,
        returnValue: "resultRows",
      });
    } else {
      throw new Error("Invalid database connection");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

export async function saveImage(
  db: SqliteDb,
  filename: string,
  data: ArrayBuffer,
): Promise<boolean> {
  return executeWithTransaction(db, async (exec) => {
    await exec("INSERT INTO images (filename, data) VALUES (?, ?);", [
      filename,
      data,
    ]);
  });
}

export async function getImage(
  db: SqliteDb,
  filename: string,
): Promise<ArrayBuffer | null> {
  try {
    let rows;
    if (db.db) {
      rows = await db.db.exec({
        sql: "SELECT data FROM images WHERE filename = ?;",
        bind: [filename],
        returnValue: "resultRows",
      });
    } else if (db.promiser && db.dbId) {
      rows = await db.promiser("exec", {
        dbId: db.dbId,
        sql: "SELECT data FROM images WHERE filename = ?;",
        bind: [filename],
        returnValue: "resultRows",
      });
    } else {
      throw new Error("Invalid database connection");
    }

    return rows.length > 0 ? rows[0][0] : null;
  } catch (error) {
    console.error("Error getting image:", error);
    return null;
  }
}
