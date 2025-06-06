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

let activeSearchQuery = $state("");
let activeSearchSource = $state<string | undefined>(undefined);

let searchOffset = $state(0);
let searchIsLoading = $state(false);
let searchHasMore = $state(true);
const SEARCH_PAGE_SIZE = 10;

let currentOffset = $state(0);
let isLoading = $state(false);
let hasMoreConversationsToLoad = $state(true);

export function getActiveSearchQuery() {
  return activeSearchQuery;
}
export function getIsLoading() {
  return isLoading;
}

export function getCurrentOffset() {
  return currentOffset;
}
export function setCurrentOffset(offset: number) {
  currentOffset = offset;
}

export function getHasMoreConversationsToLoad() {
  return hasMoreConversationsToLoad;
}

export function setHasMoreConversationsToLoad(hasMore: boolean) {
  hasMoreConversationsToLoad = hasMore;
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

export function getIsSearchLoading() {
  return searchIsLoading;
}
export function getSearchHasMore() {
  return searchHasMore;
}

export function setActiveSearchSource(source: string) {
  activeSearchSource = source;
}

export async function executeNewSearch(query: string, source?: string) {
  activeSearchQuery = query.trim();
  activeSearchSource = source;

  if (!activeSearchQuery && !activeSearchSource) {
    conversationsResult.length = 0;
    // activeSearchQuery is already ""
    // activeSearchSource is already undefined
    searchOffset = 0;
    searchHasMore = true; // Reset, or false if query is empty
    if (selectedConversation.id && conversationsResult.length === 0) {
      // Optionally clear selectedConversation if no search results
      // setSelectedConversation({ id: "", title: "", created_at: 0, updated_at:
      // 0, messages: [], source: "" });
    }
    return;
  }

  searchIsLoading = true;
  searchOffset = 0;
  conversationsResult.length = 0; // Clear previous results for a new search
  searchHasMore = true; // Assume there might be results

  let sql = `
SELECT c.id, c.source, c.title, c.created_at, c.updated_at, c.url,
c.meta, c.tags, c.content
FROM conversations c
JOIN conversations_fts_idx fts ON c.id = fts.rowid_original_conversations
`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (activeSearchQuery) {
    whereClauses.push("conversations_fts_idx MATCH ?");
    params.push(activeSearchQuery);
  }
  if (activeSearchSource) {
    whereClauses.push("c.source = ?");
    params.push(activeSearchSource);
  }

  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  sql += `
ORDER BY rank
LIMIT ? OFFSET ?
`;
  params.push(SEARCH_PAGE_SIZE, searchOffset);

  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        target: "offscreen",
        type: "EXECUTE_QUERY",
        sql: sql,
        params: params,
      },
      (response) => {
        searchIsLoading = false;
        if (
          response.success &&
          response.result &&
          response.result.result &&
          response.result.result.resultRows
        ) {
          const newItems = response.result.result.resultRows.map(
            (row: any) => ({
              id: row[0],
              source: row[1],
              title: row[2],
              created_at: row[3],
              updated_at: row[4],
              url: row[5],
              meta: row[6],
              tags: row[7],
              messages: JSON.parse(row[8]),
            }),
          );
          for (const conv of newItems) {
            conversationsResult.push(conv);
          }
          searchOffset += newItems.length;
          searchHasMore = newItems.length <= SEARCH_PAGE_SIZE;
          resolve();
        } else {
          const errorMsg =
            response?.error || "Unknown error executing new search";
          console.error("Failed to execute new search.", errorMsg);
          searchHasMore = false; // Stop trying to load more on error
          reject(new Error(errorMsg));
        }
      },
    );
  });
}

export async function loadMoreSearchResults() {
  if (
    searchIsLoading ||
    !searchHasMore ||
    (!activeSearchQuery && !activeSearchSource)
  ) {
    return;
  }
  searchIsLoading = true;

  let sql = `
SELECT c.id, c.source, c.title, c.created_at, c.updated_at, c.url,
c.meta, c.tags, c.content
FROM conversations c
JOIN conversations_fts_idx fts ON c.id = fts.rowid_original_conversations
`;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (activeSearchQuery) {
    whereClauses.push("conversations_fts_idx MATCH ?");
    params.push(activeSearchQuery);
  }
  if (activeSearchSource) {
    whereClauses.push("c.source = ?");
    params.push(activeSearchSource);
  }

  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  sql += `
ORDER BY rank
LIMIT ? OFFSET ?
`;
  params.push(SEARCH_PAGE_SIZE, searchOffset);

  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        target: "offscreen",
        type: "EXECUTE_QUERY",
        sql: sql,
        params: params,
      },
      (response) => {
        searchIsLoading = false;
        if (
          response.success &&
          response.result &&
          response.result.result &&
          response.result.result.resultRows
        ) {
          const newItems = response.result.result.resultRows.map(
            (row: any) => ({
              id: row[0],
              source: row[1],
              title: row[2],
              created_at: row[3],
              updated_at: row[4],
              url: row[5],
              meta: row[6],
              tags: row[7],
              messages: JSON.parse(row[8]),
            }),
          );
          for (const conv of newItems) {
            conversationsResult.push(conv);
          }
          searchOffset += newItems.length;
          searchHasMore = newItems.length === SEARCH_PAGE_SIZE;
          resolve();
        } else {
          const errorMsg =
            response?.error || "Unknown error loading more search results";
          console.error("Failed to load more search results.", errorMsg);
          searchHasMore = false; // Stop trying to load more on error
          reject(new Error(errorMsg));
        }
      },
    );
  });
}
export async function setConversationsResult(
  searchQuery: string,
  limit?: number,
  offset?: number,
) {
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        target: "offscreen",
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
          conversationsResult.length = 0;

          for (const row of response.result.result.resultRows) {
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
  if (isLoading || (!hasMoreConversationsToLoad && currentOffset)) {
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
        target: "offscreen",
        type: "GET_CONVERSATIONS",
        payload: {
          limit: 50,
          offset: currentOffset,
          source: activeSearchSource?.toLowerCase(),
        },
      },
      (response) => {
        isLoading = false;
        if (response && response.success) {
          // clear conversations if selected source has no chats
          if (!response.conversations.length && activeSearchSource) {
            conversations.length = 0;
          }

          if (response.conversations && response.conversations.length > 0) {
            // Select the first conversation only on the very first load if
            // nothing is selected
            if (
              currentOffset === 0 &&
              conversations.length === 0 &&
              !selectedConversation.id
            ) {
              setSelectedConversation(response.conversations[0]);
            }

            // if first time selecting a source aka offset is zero
            // reset conversations array
            if (currentOffset === 0 && activeSearchSource) {
              conversations.length = 0;
            }
            for (const conv of response.conversations) {
              conversations.push(conv); // APPEND new conversations
            }
            currentOffset += response.conversations.length; // Update offset

            if (response.conversations.length < 50) {
              // Fewer than limit means no more
              setHasMoreConversationsToLoad(false);
            }
          } else {
            // No conversations returned, so no more to load
            setHasMoreConversationsToLoad(false);
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
      { target: "offscreen", type: "SAVE_CONVERSATIONS", conversations: newConversationData },
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
