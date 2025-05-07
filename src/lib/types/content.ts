export type Message = {
  /** Created at (we don't care about updated at, it might get overwritten, but created_at fits the message into the conversation flow) */
  created_at: number,
  author: "user" | "assistant",
  /** MD content */
  content: string
}

export type Conversation = {
  id: string,
  created_at: number,
  updated_at: number,
  /** ChatGPT, Claude, etc. */
  source: string
  messages: Message[]
}
