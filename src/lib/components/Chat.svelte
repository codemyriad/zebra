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
            <div>Id: {selectedConversation.id}</div>
            <div>Source: {selectedConversation.source}</div>
            <div>Title: {selectedConversation.title}</div>

            {#each selectedConversation.messages as msg}
                <!-- <p>Author: {msg.author}</p>
                <p>Content: {msg.content}</p> -->
                {#if msg.author === "assistant"}
                    <div class="chat chat-start">
                        <div class="chat-header">
                            {msg.author}

                            <time class="text-xs opacity-50">
                                Created At: {new Date(
                                    selectedConversation.created_at,
                                ).toISOString()}
                            </time>
                        </div>
                        <div class="chat-bubble w-full">
                            {@html md.render(msg.content)}
                        </div>
                        <div class="chat-footer opacity-50">
                            Updated At: {new Date(
                                selectedConversation.updated_at,
                            ).toISOString()}
                        </div>
                    </div>
                {/if}

                {#if msg.author === "user"}
                    <div class="chat chat-end">
                        <div class="chat-header">
                            {msg.author}

                            <time class="text-xs opacity-50">
                                Created At: {new Date(
                                    selectedConversation.created_at,
                                ).toISOString()}
                            </time>
                        </div>
                        <div class="chat-bubble w-full">
                            {@html md.render(msg.content)}
                        </div>
                        <div class="chat-footer opacity-50">
                            Updated At: {new Date(
                                selectedConversation.updated_at,
                            ).toISOString()}
                        </div>
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>

<style>
    code {
        text-wrap: pretty;
    }
</style>
