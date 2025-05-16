<script lang="ts">
    import type { Conversation } from "../types/content";
    import markdownit from "markdown-it";
    const md = markdownit();

    let {
        convs = [],
        selectedConversation,
    }: {
        convs: Conversation[];
        selectedConversation: Conversation | undefined;
    } = $props();
</script>

<div>
    <div class="messages">
        {#if selectedConversation}
            <!-- Conversation Details Header -->
            <div class="mb-6 p-4 bg-base-200 rounded-box shadow">
                <h3
                    class="text-base font-semibold
text-primary"
                >
                    {selectedConversation.title}
                </h3>
                <div class="text-sm opacity-70 mt-1">
                    <span>ID: {selectedConversation.id}</span> |
                    <span
                        >Source: <span
                            class="badge badge-sm
badge-outline">{selectedConversation.source}</span
                        ></span
                    >
                    |
                    <span
                        >Last updated: {new Date(
                            selectedConversation.updated_at,
                        ).toLocaleString()}</span
                    >
                </div>
            </div>

            {#each selectedConversation.messages as msg}
                {#if msg.author === "assistant"}
                    <div class="chat chat-start">
                        <div class="chat-header">
                            {msg.author}
                            <time class="text-xs opacity-50 ml-1">
                                {new Date(msg.created_at).toLocaleString()}
                            </time>
                        </div>
                        <div
                            class="chat-bubble chat-bubble-primary
text-base"
                        >
                            {@html md.render(msg.content)}
                        </div>
                        <div class="chat-footer opacity-50"></div>
                    </div>
                {/if}

                {#if msg.author === "user"}
                    <div class="chat chat-end">
                        <div class="chat-header">
                            {msg.author}
                            <time class="text-xs opacity-50 ml-1">
                                {new Date(msg.created_at).toLocaleString()}
                            </time>
                        </div>
                        <div class="chat-bubble w-full text-base">
                            {@html md.render(msg.content)}
                        </div>
                        <div class="chat-footer opacity-50"></div>
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>
