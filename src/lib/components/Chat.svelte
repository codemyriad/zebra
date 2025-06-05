<script lang="ts">
    import { onDestroy } from "svelte";
    import { getImageMapping } from "../state/conversations.svelte";
    import type { Conversation } from "../types/content";
    import markdownit from "markdown-it";
    const md = markdownit();

    let {
        selectedConversation,
        imageMapping = new Map(),
    }: {
        convs: Conversation[];
        selectedConversation: Conversation | undefined;
        imageMapping: Map<string, { data: Uint8Array; mimeType: string }>;
    } = $props();

    // Keep track of active Object URLs to avoid leaks
    const activeObjectURLs = new Map<string, string>();

    function cleanupObjectUrls() {
        activeObjectURLs.forEach((url, filename) => {
            URL.revokeObjectURL(url);
            activeObjectURLs.delete(filename);
        });
    }
    onDestroy(() => cleanupObjectUrls());

    // Clean up Object URLs when they're no longer needed
    function revokeObjectUrl(filename: string) {
        if (activeObjectURLs.has(filename)) {
            URL.revokeObjectURL(activeObjectURLs.get(filename)!);
            activeObjectURLs.delete(filename);
        }
    }

    // Store the ORIGINAL renderer before we override it
    const originalImageRenderer =
        md.renderer.rules.image ||
        function (tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

    // Override the image renderer
    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const originalSrc = token.attrGet("src");

        if (originalSrc && getImageMapping().has(`sediment://${originalSrc}`)) {
            const { data, mimeType } = getImageMapping().get(
                `sediment://${originalSrc}`,
            )!;

            // Revoke previous URL (if any) to avoid leaks
            revokeObjectUrl(originalSrc);

            // Create a fresh Object URL
            let blob;
            try {
                blob = new Blob([data], { type: mimeType });
                console.log("Blob created successfully", blob);
                const objectUrl = URL.createObjectURL(blob);
                activeObjectURLs.set(originalSrc, objectUrl);
                console.log("Object URL created successfully", objectUrl);
                // Update the image src
                token.attrSet("src", objectUrl);
            } catch (err) {
                console.error("Blob creation failed:", err);
            }
        }

        // Fall back to default rendering
        return originalImageRenderer(tokens, idx, options, env, self);
    };
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
                            class="prose lg:prose-xl chat-bubble chat-bubble-primary"
                        >
                            {@html md.render(msg.content, {
                                imageMapping,
                            })}
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
                        <div
                            class="prose lg:prose-xl chat-bubble text-gray-300"
                        >
                            {@html md.render(msg.content)}
                        </div>
                        <div class="chat-footer opacity-50"></div>
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</div>
