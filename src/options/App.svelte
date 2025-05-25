<script lang="ts">
    import { onMount } from "svelte";
    import { BotMessageSquare, Menu } from "lucide-svelte";

    import Sidebar from "../lib/components/Sidebar.svelte";
    import type { Conversation } from "../lib/types/content";
    import Chat from "../lib/components/Chat.svelte";
    import {
        conversations,
        loadConversationsFromBackground,
        getSelectedConversation,
        selectedConversation,
    } from "../lib/state/conversations.svelte";
    import { executeQuery } from "../lib/sqlite/sqlite-handler";

    let searchQuery = $state("");
    // let selectedConversation = $state<Conversation>();

    onMount(() => {
        // Get search query from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlSearchQuery = urlParams.get("search");

        chrome.runtime.sendMessage(
            {
                type: "GET_CONVERSATIONS",
                payload: {
                    limit: 50,
                    offset: 0,
                },
            },
            async (response) => {
                console.log({ response });
                if (response.success) {
                    await loadConversationsFromBackground();
                    console.log("Conversations:", response.conversations);
                }
            },
        );
        if (urlSearchQuery) {
            searchQuery = urlSearchQuery;
            // TODO: Trigger search with the query
            chrome.runtime.sendMessage(
                {
                    type: "EXECUTE_QUERY",
                    sql: "SELECT * FROM conversations WHERE source LIKE ?",
                    params: [`%${searchQuery}%`],
                },
                (response) => {
                    if (response.success) {
                        console.log("Query result:", response.result);
                    }
                },
            );

            console.log(`Searching for: ${searchQuery}`);
        }
    });
</script>

<div class="drawer lg:drawer-open">
    <input id="options-drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col p-6">
        <!-- Page content here -->
        <div class="flex justify-between items-center mb-6">
            <label
                for="options-drawer"
                class="btn btn-primary btn-md drawer-button lg:hidden"
                aria-label="Open sidebar"
            >
                <Menu aria-hidden />
            </label>
        </div>

        <div
            class="card bg-base-200 shadow-xl p-6 min-h-[70vh] flex items-center justify-center"
        >
            <div class="max-w-3xl flex flex-col gap-y-2 items-center">
                <BotMessageSquare size={64} />

                {#if conversations.length}
                    <Chat convs={conversations} {selectedConversation} />
                {:else}
                    <p class="text-lg">
                        No conversations found. Start chatting with an LLM to
                        see your history here.
                    </p>
                {/if}
            </div>
        </div>
    </div>

    <Sidebar {searchQuery} {selectedConversation} />
</div>
