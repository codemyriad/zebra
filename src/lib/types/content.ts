export type Message = {
  /** Created at (we don't care about updated at, it might get overwritten, but created_at fits the message into the conversation flow) */
  created_at: number;
  author: "user" | "assistant";
  /** MD content */
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  /** ChatGPT, Claude, etc. */
  source: string;
  messages: Message[];
  content?: string;
  url?: string;
  meta?: string;
  tags?: string;
};

export interface ChatGPTMessage {
  id: string;
  author: {
    role: "user" | "assistant" | "system";
  };
  create_time: number;
  content: {
    content_type: string;
    parts?: string[];
    text?: string;
    thoughts?: Array<{
      content: string;
    }>;
  };
  metadata?: {
    model_slug?: string;
  };
}

export interface ChatGPTConversation {
  title: string;
  create_time: number;
  update_time: number;
  mapping: {
    [key: string]: {
      message: ChatGPTMessage;
      parent: string | null;
      children: string[];
    };
  };
  current_node: string;
}
export interface ClaudeContentBlock {
  start_timestamp?: string;
  stop_timestamp?: string;
  type: string;
  text?: string;
  citations?: any[];
}

export interface ClaudeChatMessage {
  uuid: string;
  text?: string;
  content?: ClaudeContentBlock[];
  sender: "human" | "assistant";
  created_at: string;
  updated_at: string;
  attachments?: any[];
  files?: any[];
}

export interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  account?: {
    uuid: string;
  };
  chat_messages: ClaudeChatMessage[];
}

export interface DeepSeekMessageContent {
  files: any[];
  search_results: any | null;
  model: string;
  reasoning_content: any | null;
  content: string;
  inserted_at: string;
}

export interface DeepSeekMappingItem {
  id: string;
  parent: string | "root";
  children: string[];
  message: DeepSeekMessageContent | null;
}

export interface DeepSeekConversationWithMapping {
  id: string;
  title: string;
  inserted_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  mapping: Record<string, DeepSeekMappingItem>;
}
