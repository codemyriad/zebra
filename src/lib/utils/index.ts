import type {
  Conversation,
  ChatGPTConversation,
  ChatGPTMessage,
  ClaudeChatMessage,
  ClaudeContentBlock,
  ClaudeConversation,
  Message,
} from "../types/content";
/**
 * Converts Claude API conversation data to the desired output format
 * @param claudeData - Array of Claude conversation objects
 * @returns Array of conversations in the desired format
 */
export function convertClaudeToDesiredFormat(
  claudeData: ClaudeConversation[],
): Conversation[] {
  return claudeData.map((conversation) => {
    // Extract basic conversation metadata
    const result: Conversation = {
      id: conversation.uuid,
      title: conversation.name || "Untitled Conversation",
      created_at: new Date(conversation.created_at).getTime(),
      updated_at: new Date(conversation.updated_at).getTime(),
      source: "claude",
      messages: [],
    };

    // Process messages
    if (
      conversation.chat_messages &&
      Array.isArray(conversation.chat_messages)
    ) {
      result.messages = conversation.chat_messages.map((msg) => {
        // Determine message content
        let content = "";

        // Handle different content structures
        if (msg.text) {
          // Direct text field
          content = msg.text;
        } else if (msg.content && Array.isArray(msg.content)) {
          // Content array with text blocks
          content = msg.content
            .filter((block) => block.type === "text" && block.text)
            .map((block) => block.text)
            .join("\n");
        }

        const message: Message = {
          created_at: new Date(msg.created_at).getTime(),
          author: msg.sender === "human" ? "user" : "assistant",
          content: content,
        };

        return message;
      });
    }

    return result;
  });
}

export function convertChatGPTToDesiredFormat(
  chatGPTData: ChatGPTConversation[],
): Conversation[] {
  return chatGPTData.map((conversation) => {
    // Extract basic conversation metadata
    const result: Conversation = {
      id: conversation.current_node || Object.keys(conversation.mapping)[0],
      title: conversation.title || "Untitled Conversation",
      created_at: conversation.create_time * 1000, // Convert to milliseconds
      updated_at: conversation.update_time * 1000,
      source: "chatgpt",
      messages: [],
    };

    // Build message chain by following parent->child relationships
    const messages: Message[] = [];
    const visitedNodes = new Set<string>();

    // Helper function to traverse the message tree
    const traverseMessages = (nodeId: string) => {
      if (visitedNodes.has(nodeId) || !conversation.mapping[nodeId]) return;

      visitedNodes.add(nodeId);
      const node = conversation.mapping[nodeId];

      if (node.message) {
        // Determine message content
        let content = "";
        const msgContent = node.message.content;

        if (msgContent.parts && Array.isArray(msgContent.parts)) {
          content = msgContent.parts.join("\n");
        } else if (msgContent.text) {
          content = msgContent.text;
        } else if (msgContent.thoughts && Array.isArray(msgContent.thoughts)) {
          content = msgContent.thoughts.map((t) => t.content).join("\n");
        }

        if (content) {
          messages.push({
            created_at: node.message.create_time * 1000,
            author: node.message.author.role === "user" ? "user" : "assistant",
            content: content,
            // model: node.message.metadata?.model_slug,
          });
        }
      }

      // Process children
      node.children.forEach((childId) => traverseMessages(childId));
    };

    // Find root nodes (nodes with no parent or parent not in mapping)
    const rootNodes = Object.entries(conversation.mapping)
      .filter(
        ([id, node]) => !node.parent || !conversation.mapping[node.parent],
      )
      .map(([id]) => id);

    // Traverse from all root nodes
    rootNodes.forEach((rootId) => traverseMessages(rootId));

    // Sort messages by timestamp (since tree traversal might not maintain order)
    result.messages = messages.sort((a, b) => a.created_at - b.created_at);

    return result;
  });
}
/**
 * Process a single Claude conversation
 * @param conversation - Single Claude conversation object
 * @returns Conversation in the desired format
 */
export function processSingleConversation(
  conversation: ClaudeConversation,
): Conversation {
  return convertClaudeToDesiredFormat([conversation])[0];
}
