import type { Conversation, Message } from "./types/content";

// Session token
export async function getSessionToken(tabId: string): Promise<string> {
  const accessToken = localStorage.getItem("userToken");
  console.log({ accessToken });
  return accessToken;
}

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
  chat_sessions: ChatSessionMultiple[];
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

  console.log("deepseekRes multiple", await res.json());
  return res.json();
}

async function _fetchConversation(
  sessionToken: string,
  sessionId: string,
): Promise<DeepSeekConversationResponse> {
  try {
    const res = await fetch(
      `https://chat.deepseek.com/api/v0/chat/history_messages?chat_session_id=${sessionId}&cache_version=33`,
      {
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      },
    );
    console.log("deepseekRes single", await res.json());
    return res.json();
  } catch (e) {
    console.log({ e });
  }
  return true;
}

async function getAllConversations(
  sessionToken: string,
): Promise<Omit<Conversation, "messages">[]> {
  const {
    data: {
      biz_data: { chat_sessions },
    },
  } = await _fetchConversations(sessionToken);

  console.log("HEREEEEEEE");
  const first = await _fetchConversations(chat_sessions[0].id);
  console.log({ first });
  const res = await Promise.all(
    chat_sessions.map((session, i) =>
      _fetchConversation(sessionToken, session.id),
    ),
  );
  // const items = res.flatMap(({ data }) => items);
  console.log("All conversations:", { res });
  return res;
}

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

async function _fetchMessages(
  sessionToken: string,
  conversationId: string,
): Promise<MessageContentRaw[]> {
  const res = await fetch(
    `https://chatgpt.com/backend-api/conversation/${conversationId}`,
    {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    },
  );
  const json = (await res.json()) as ConversationRaw;

  if (!json.mapping) {
    console.log("No mapping found for conversation", conversationId);
    return [];
  }

  return Object.values(json.mapping)
    .map(({ message }) => message)
    .filter(Boolean) as MessageContentRaw[];
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

async function getMessages(
  sessionToken: string,
  conversationId: string,
): Promise<Message[]> {
  const res = await _fetchMessages(sessionToken, conversationId);
  return processMessages(res);
}

export async function getConversationHistory(
  token: string,
): Promise<Conversation[]> {
  // const sessionToken = await getSessionToken(tabId);
  console.log({ token });
  const conversations = await getAllConversations(token);

  console.log({ conversations });
  return conversations;
  // return await Promise.all(
  //   conversations.map(async (c) => ({
  //     ...c,
  //     messages: await getMessages(sessionToken, c.id),
  //   })),
  // );
}
