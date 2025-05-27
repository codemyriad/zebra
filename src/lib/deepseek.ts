import type { Conversation, Message } from "./types/content";

// Messages
type ConversationRaw = {
  mapping: Record<string, MessageItemRaw>;
};

type MessageItemRaw = {
  message: MessageContentRaw | null;
};

type MessageContentRaw = {
  create_time: number;
  author: {
    role: "user" | "assistant" | "system";
  };
  content: {
    parts: string[];
  };
};
interface ChatSessionMultiple {
  id: string;
  seq_id: number;
  title: string;
  title_type: "SYSTEM" | string; // Assuming "SYSTEM" is the primary type
  updated_at: number; // Unix timestamp with milliseconds
}

interface ChatSession {
  id: string;
  seq_id: number;
  agent: string;
  character: string | null;
  title: string;
  title_type: "SYSTEM" | string; // Add other possible types if needed
  version: number;
  current_message_id: number;
  inserted_at: number; // Unix timestamp with milliseconds
  updated_at: number; // Unix timestamp with milliseconds
}

interface BizDataMultiple {
  chat_sessions: ChatSession[];
  has_more: boolean;
}

interface BizData {
  chat_session: ChatSession;
  chat_messages: any[];
  cache_valid: boolean;
  route_id: string | null;
}

interface ApiResponseData {
  biz_code: number;
  biz_msg: string;
  biz_data: BizData;
}

interface ApiResponseDataMultiple {
  biz_code: number;
  biz_msg: string;
  biz_data: BizDataMultiple;
}

interface DeepSeekConversationResponse {
  code: number;
  msg: string;
  data: ApiResponseData;
}

interface DeepSeekConversationResponseMultiple {
  code: number;
  msg: string;
  data: ApiResponseDataMultiple;
}

async function _fetchConversations(
  sessionToken: string,
): Promise<DeepSeekConversationResponseMultiple> {
  const res = await fetch(
    `https://chat.deepseek.com/api/v0/chat_session/fetch_page`,
    {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    },
  );

  return res.json();
}

async function _fetchConversation(
  sessionToken: string,
  sessionId: string,
): Promise<DeepSeekConversationResponse> {
  const res = await fetch(
    `https://chat.deepseek.com/api/v0/chat/history_messages?chat_session_id=${sessionId}&cache_version=33`,
    {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    },
  );

  return res.json();
}

function messageFilter(message: MessageContentRaw): boolean {
  return ["user", "assistant"].includes(message?.author?.role);
}

function pickFromMessage(message: MessageContentRaw): Message {
  return {
    created_at: message.create_time,
    author: message.author.role as "user" | "assistant",
    content: message.content.parts?.join("\n") || "",
  };
}

function processMessages(messages: MessageContentRaw[]): Message[] {
  return messages
    .filter(messageFilter)
    .map(pickFromMessage)
    .filter(({ content }) => Boolean(content));
}

/**Same as CHat Session */
// type ConversationItemRaw = {
//   id: string;
//   title: string;
//   create_time: number;
//   update_time: number;
// };
function _pickFromConversation(
  item: ChatSession,
): Omit<Conversation, "messages"> {
  return {
    id: item.id,
    title: item.title,
    created_at: item.inserted_at,
    updated_at: item.updated_at,
    source: "deepseek",
  };
}

function _processConversations(
  items: ChatSession[],
): Omit<Conversation, "messages">[] {
  return items.map(_pickFromConversation);
}
async function getConversations(
  sessionToken: string,
): Promise<Omit<Conversation, "messages">[]> {
  const {
    data: {
      biz_data: { chat_sessions },
    },
  } = await _fetchConversations(sessionToken); // One default call to get the total

  return _processConversations(chat_sessions);
}

async function getMessages(
  sessionToken: string,
  conversationId: string,
): Promise<Message[]> {
  const {
    data: {
      biz_data: { chat_messages },
    },
  } = await _fetchConversation(sessionToken, conversationId);
  return processMessages(chat_messages);
}

export async function getConversationHistory(
  token: string,
): Promise<Conversation[]> {
  const conversations = await getConversations(token);

  console.log({ conversations });
  return await Promise.all(
    conversations.map(async (c) => ({
      ...c,
      messages: await getMessages(token, c.id),
    })),
  );
}
