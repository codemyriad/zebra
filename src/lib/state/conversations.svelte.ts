import type { Conversation } from "../types/content";
export let conversations = $state<Conversation[]>([]);
export let conversationsResult = $state<Conversation[]>([]);

export let selectedConversation = $state<Conversation>({
  id: "",
  title: "",
  created_at: 0,
  updated_at: 0,
  messages: [],
  source: "",
});

let currentOffset = $state(0);
let isLoading = $state(false);
let hasMoreConversationsToLoad = $state(true);

export function getIsLoading() {
  return isLoading;
}

export function getCurrentOffset() {
  return currentOffset;
}

export function getHasMoreConversationsToLoad() {
  return hasMoreConversationsToLoad;
}

export function setSelectedConversation(conversation: Conversation) {
  selectedConversation.created_at = conversation.created_at;
  selectedConversation.title = conversation.title;
  selectedConversation.messages = conversation.messages;
  selectedConversation.source = conversation.source;
  selectedConversation.id = conversation.id;
  selectedConversation.updated_at = conversation.updated_at;
}
export function getSelectedConversation() {
  return selectedConversation;
}
export async function getConversationsResult() {
  return conversationsResult;
}
export async function setConversationsResult(searchQuery: string) {
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "EXECUTE_QUERY",
        sql: `
             SELECT c.id, c.source, c.title, c.created_at, c.updated_at, c.url,
   c.meta, c.tags, c.content
             FROM conversations c
             JOIN conversations_fts_idx fts ON c.id =
   fts.rowid_original_conversations
             WHERE conversations_fts_idx MATCH ?
             ORDER BY rank -- FTS5 implicit rank column for relevance
           `,
        params: [searchQuery], // Pass the search query directly for FTS MATCH
      },
      (response) => {
        if (response.success) {
          console.log("Query result:", response.result);
          conversationsResult.length = 0;

          for (const row of response.result) {
            const conv = {
              id: row[0],
              source: row[1],
              title: row[2],
              created_at: row[3],
              updated_at: row[4],
              url: row[5],
              meta: row[6],
              tags: row[7],
              messages: JSON.parse(row[8]),
            };
            conversationsResult.push(conv);
          }
          resolve();
        } else {
          const errorMsg =
            response?.error || "Unknown error searching for conversations";
          console.error(
            "Shared Rune State: Failed to search for conversations.",
            errorMsg,
          );

          reject(new Error(errorMsg));
        }
      },
    );
  });
}
// Function to load conversations from the background script
// and update the shared 'conversations' state.
export async function loadConversationsFromBackground() {
  if (isLoading || !hasMoreConversationsToLoad) {
    console.log(
      "Shared Rune State: Already loading or no more conversations toload.",
    );
    return;
  }

  isLoading = true;
  console.log(`Shared Rune State: Requesting conversations from background
(offset: ${currentOffset})...`);
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "GET_CONVERSATIONS",
        payload: { limit: 50, offset: currentOffset },
      },
      (response) => {
        isLoading = false;
        if (response && response.success) {
          // conversations.length = 0; // REMOVED: Do not clear for incremental loading

          if (response.conversations && response.conversations.length > 0) {
            // Select the first conversation only on the very first load if nothing is selected
            if (
              currentOffset === 0 &&
              conversations.length === 0 &&
              !selectedConversation.id
            ) {
              setSelectedConversation(response.conversations[0]);
            }
            for (const conv of response.conversations) {
              conversations.push(conv); // APPEND new conversations
            }
            currentOffset += response.conversations.length; // Update offset

            if (response.conversations.length < 50) {
              // Fewer than limit means no more
              hasMoreConversationsToLoad = false;
            }
          } else {
            // No conversations returned, so no more to load
            hasMoreConversationsToLoad = false;
          }

          console.log(
            "Shared Rune State: Conversations loaded/appended and state updated.",
          );
          resolve();
        } else {
          const errorMsg =
            response?.error || "Unknown error loading conversations";
          console.error(
            "Shared Rune State: Failed to load conversations.",
            errorMsg,
          );
          reject(new Error(errorMsg));
        }
      },
    );
  });
}

export async function addNewConversationsAndRefresh(
  newConversationData: Conversation[],
) {
  return new Promise<void>((resolve, reject) =>
    chrome.runtime.sendMessage(
      { type: "SAVE_CONVERSATIONS", conversations: newConversationData },
      (response) => {
        if (response && response.success) {
          console.log(
            "Shared Rune State: Conversation saved, refreshing list...",
          );
          resolve();
        } else {
          const errorMsg =
            response?.error || "Unknown error saving conversation";
          console.error(
            "Shared Rune State: Failed to save conversation.",
            errorMsg,
          );
          reject(new Error(errorMsg));
        }
      },
    ),
  ).then(() => {
    // Reset state for a full refresh
    conversations.length = 0;
    currentOffset = 0;
    hasMoreConversationsToLoad = true;
    isLoading = false; // Ensure isLoading is reset
    return loadConversationsFromBackground();
  });
}
