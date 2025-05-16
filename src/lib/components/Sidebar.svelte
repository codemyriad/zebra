<script lang="ts">
    import { Search } from "lucide-svelte";
    import ThemeSwitcher from "./ThemeSwitcher.svelte";
    import ImportForm from "./ImportForm.svelte";
    import type { Conversation } from "../types/content";
    import {
        conversationsResult,
        setSelectedConversation,
        setConversationsResult,
        getConversationsResult,
    } from "../state/conversations.svelte";

    let {
        searchQuery,
        conversations = [],
        selectedConversation,
    }: {
        searchQuery: string;
        conversations: Conversation[];
        selectedConversation: Conversation | undefined;
    } = $props();

    let selectedSource = $state("all");

    const sources = [
        { id: "all", name: "All", count: 0 },
        { id: "chatgpt", name: "ChatGPT", count: 0 },
        { id: "claude", name: "Claude", count: 0 },
    ];

    async function handleSearch(event: Event) {
        if (event instanceof KeyboardEvent && event.key === "Enter") {
            setConversationsResult(searchQuery);
            const convResult = await getConversationsResult();
            if (convResult.length) {
                setSelectedConversation(convResult[0]);
            }

            console.log(`Searching for: ${searchQuery}`);
        }
    }

    function selectSource(sourceId: string) {
        selectedSource = sourceId;
        // TODO: Filter conversations by source
        console.log(`Selected source: ${sourceId}`);
    }
</script>

<div class="drawer-side h-full z-10">
    <label
        for="options-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
    ></label>

    <div
        class="menu p-4 w-80 bg-base text-base-content border-r flex flex-col gap-y-8 bg-base-100"
    >
        <!-- Sidebar content here -->
        <div class="flex items-center">
            <div class="w-12 h-12 mr-3">
                <img
                    src="/assets/logo.svg"
                    alt="Zebra Logo"
                    class="w-full h-full"
                />
            </div>
            <div>
                <h2 class="text-xl font-bold text-primary">Zebra Cache</h2>
                <p class="text-xs opacity-70">LLM Conversation History</p>
            </div>
        </div>

        <!-- Search -->
        <div>
            <label class="input input-bordered flex items-center gap-2">
                <Search size={18} class="h-[1em] opacity-50" />
                <input
                    type="text"
                    placeholder="Search conversations..."
                    class=""
                    bind:value={searchQuery}
                    onkeydown={handleSearch}
                />
            </label>
        </div>

        <!-- Source Filter -->
        <div>
            <h3 class="font-medium mb-2">Sources</h3>
            <div class="flex flex-wrap gap-2">
                {#each sources as source}
                    <button
                        class="badge badge-lg {selectedSource === source.id
                            ? 'badge-primary'
                            : 'badge-outline'}"
                        onclick={() => selectSource(source.id)}
                    >
                        {source.name}
                        {source.count > 0 ? `(${source.count})` : ""}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Search Result Conversation List -->
        <div class="grow">
            <h3 class="font-medium mb-2">Search Result</h3>
            {#if conversationsResult.length === 0}
                <div class="text-sm opacity-70 p-4 text-center">
                    Search for a keyword in the search bar above...
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each conversationsResult as conversation}
                        <li>
                            <button
                                class="block p-2 hover:bg-base-300 rounded-lg"
                                onclick={() =>
                                    setSelectedConversation(conversation)}
                            >
                                {conversation.title}
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
        <!-- Conversation List -->
        <div class="grow">
            <h3 class="font-medium mb-2">All Conversations</h3>
            {#if conversations.length === 0}
                <div class="text-sm opacity-70 p-4 text-center">
                    No conversations found
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each conversations as conversation}
                        {#if selectedSource === "all" || conversation.source.toLowerCase() === selectedSource}
                            <li>
                                <button
                                    class="block p-2 hover:bg-base-300 rounded-lg"
                                    onclick={() =>
                                        setSelectedConversation(conversation)}
                                >
                                    {conversation.title}
                                </button>
                            </li>
                        {/if}
                    {/each}
                </ul>
            {/if}
        </div>

        <ImportForm />
        <div class="justify-self-end self-end">
            <ThemeSwitcher />
        </div>
    </div>
</div>
