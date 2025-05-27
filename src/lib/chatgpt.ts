import type { Conversation, Message } from "./types/content";

// Session token
export async function getSessionToken(): Promise<string> {
  const { accessToken } = await (
    await fetch("https://chatgpt.com/api/auth/session")
  ).json();
  return accessToken;
}

// Conversations
type ConversationsQueryResponse = {
  total: number;
  items: ConversationItemRaw[];
};
async function _fetchConversations(
  sessionToken: string,
  offset = 0,
): Promise<ConversationsQueryResponse> {
  const res = await fetch(
    `https://chatgpt.com/backend-api/conversations?offset=${offset}`,
    {
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    },
  );

  // Res = { items, total, offset, limit }
  return res.json();
}

type ConversationItemRaw = {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
};
function _pickFromConversation(
  item: ConversationItemRaw,
): Omit<Conversation, "messages"> {
  return {
    id: item.id,
    title: item.title,
    created_at: item.create_time,
    updated_at: item.update_time,
    source: "chatgpt",
  };
}

function _processConversations(
  items: ConversationItemRaw[],
): Omit<Conversation, "messages">[] {
  return items.map(_pickFromConversation);
}

async function getConversations(
  sessionToken: string,
): Promise<Omit<Conversation, "messages">[]> {
  const { total } = await _fetchConversations(sessionToken); // One default call to get the total

  const totalRequests = Math.ceil(total / 50);
  const res = await Promise.all(
    Array(totalRequests)
      .fill(null)
      .map((_, i) => _fetchConversations(sessionToken, i * 50)),
  );
  const items = res.flatMap(({ items }) => items);

  return _processConversations(items);
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

export async function getConversationHistory(): Promise<Conversation[]> {
  const sessionToken = await getSessionToken();
  const conversations = await getConversations(sessionToken);
  return await Promise.all(
    conversations.map(async (c) => ({
      ...c,
      messages: await getMessages(sessionToken, c.id),
    })),
  );
}
