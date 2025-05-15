import type { Conversation } from "../types/content"; // Adjust path to your

export let conversations = $state<Conversation[]>([]);
export let selectedConversation = $state<Conversation>({
  id: "",
  title: "",
  created_at: 0,
  updated_at: 0,
  messages: [],
  source: "",
});

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

// Function to load conversations from the background script
// and update the shared 'conversations' state.
export async function loadConversationsFromBackground() {
  console.log(
    "Shared Rune State: Requesting conversations from               background...",
  );
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "GET_CONVERSATIONS" }, (response) => {
      if (response && response.success) {
        conversations.length = 0;
        for (const conv of response.conversations) {
          conversations.push(conv);
        }

        console.log(
          "Shared Rune State: Conversations loaded and    state updated.",
          conversations,
        );
        resolve();
      } else {
        const errorMsg =
          response?.error || "Unknown error loading  conversations";
        console.error(
          "Shared Rune State: Failed to load            conversations.",
          errorMsg,
        );

        reject(new Error(errorMsg));
      }
    });
  });
}

export async function addNewConversationAndRefresh(
  newConversationData: any /*
Adjust type as needed */,
) {
  return new Promise<void>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "SAVE_CONVERSATION", conversation: newConversationData },
      (response) => {
        if (response && response.success) {
          console.log(
            "Shared Rune State: Conversation saved, refreshing list...",
          );
          loadConversationsFromBackground().then(resolve).catch(reject);
        } else {
          const errorMsg =
            response?.error || "Unknown error saving   conversation";
          console.error(
            "Shared Rune State: Failed to save conversation.",
            errorMsg,
          );
          reject(new Error(errorMsg));
        }
      },
    );
  });
}
