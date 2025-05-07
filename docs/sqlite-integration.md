# SQLite WASM Integration Documentation

This document describes the SQLite WASM integration in the Zebra LLM Conversation Cache extension, including how to interact with the database and use the available functions.

## Overview

The extension uses SQLite WASM with Origin-Private FileSystem (OPFS) support to store conversation data persistently. The implementation handles both service worker and regular contexts, providing a unified API for database operations.

## Database Schema

The database contains a single table for storing conversations:

```sql
CREATE TABLE "conversations" (
  "id" INTEGER PRIMARY KEY,
  "source" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL,
  "url" TEXT,
  "meta" TEXT,
  "tags" TEXT,
  "content" TEXT NOT NULL
);

CREATE INDEX "conversations_index_0"
ON "conversations" ("source", "title", "created_at");
```

## Interacting with the Database

### From Background Script

The database connection is initialized in the background script and stored in the `sqliteDb` variable. You can interact with it using the following functions:

1. **saveConversation(db, conversation)**: Saves a conversation to the database
2. **getConversations(db)**: Retrieves all conversations
3. **getConversation(db, id)**: Retrieves a specific conversation by ID
4. **deleteConversation(db, id)**: Deletes a conversation by ID
5. **executeQuery(db, sql, params)**: Executes arbitrary SQL queries

Example:
```typescript
import { saveConversation } from "../lib/sqlite/sqlite-handler";

// Save a conversation
const conversation = {
  id: 123,
  source: "chatgpt",
  title: "My Conversation",
  created_at: Date.now(),
  updated_at: Date.now(),
  content: "This is the conversation content"
};

saveConversation(sqliteDb, conversation);
```

### From Content Scripts or Popup

Content scripts and the popup can interact with the database by sending messages to the background script:

```typescript
// Save a conversation
chrome.runtime.sendMessage({
  type: "SAVE_CONVERSATION",
  conversation: {
    id: 123,
    source: "chatgpt",
    title: "My Conversation",
    created_at: Date.now(),
    updated_at: Date.now(),
    content: "This is the conversation content"
  }
}, (response) => {
  if (response.success) {
    console.log("Conversation saved successfully");
  } else {
    console.error("Failed to save conversation:", response.error);
  }
});

// Get all conversations
chrome.runtime.sendMessage({
  type: "GET_CONVERSATIONS"
}, (response) => {
  if (response.success) {
    console.log("Conversations:", response.conversations);
  }
});

// Get a specific conversation
chrome.runtime.sendMessage({
  type: "GET_CONVERSATION",
  id: "123"
}, (response) => {
  if (response.success) {
    console.log("Conversation:", response.conversation);
  }
});

// Delete a conversation
chrome.runtime.sendMessage({
  type: "DELETE_CONVERSATION",
  id: "123"
}, (response) => {
  if (response.success) {
    console.log("Conversation deleted successfully");
  }
});

// Execute a custom SQL query
chrome.runtime.sendMessage({
  type: "EXECUTE_QUERY",
  sql: "SELECT * FROM conversations WHERE source = ?",
  params: ["chatgpt"]
}, (response) => {
  if (response.success) {
    console.log("Query result:", response.result);
  }
});
```

## Using the executeSQL Console Function

For debugging and development purposes, the extension exposes a global `executeSQL` function that can be used from the browser console. This function allows you to run arbitrary SQL queries against the database.

To use it:

1. Open your Chrome extension
2. Right-click on the extension icon and select "Inspect"
3. Go to the "Console" tab
4. Run SQL queries using the global `executeSQL` function

Examples:

```javascript
// List all tables in the database
executeSQL("SELECT name FROM sqlite_master WHERE type='table';")

// Query all conversations
executeSQL("SELECT * FROM conversations;")

// Query with parameters
executeSQL("SELECT * FROM conversations WHERE source = ?;", ["chatgpt"])

// Insert a test conversation
executeSQL(`
  INSERT INTO conversations (id, source, title, created_at, updated_at, content)
  VALUES (?, ?, ?, ?, ?, ?);
`, [999, "test", "Console Test", Date.now(), Date.now(), "Created from console"])

// Delete a conversation
executeSQL("DELETE FROM conversations WHERE id = ?;", [999])
```

The results will be displayed in the console.

## Storage Location

The database is stored in the Origin-Private FileSystem (OPFS), which is a persistent storage area specific to your extension's origin. The database file is named "conversations.db" and is not directly accessible through the file system - it can only be accessed through the SQLite API in your extension code.
