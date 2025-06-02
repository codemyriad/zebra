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
        loadConversationsFromBackground,
        getHasMoreConversationsToLoad,
        conversations as allConversationsStore,
        getIsLoading,
        getCurrentOffset,
        executeNewSearch,
        loadMoreSearchResults,
        getIsSearchLoading,
        getSearchHasMore,
        setActiveSearchSource,
        setCurrentOffset,
        setHasMoreConversationsToLoad,
    } from "../state/conversations.svelte";
    import { get } from "svelte/store";

    let {
        searchQuery,
        selectedConversation,
    }: {
        searchQuery: string;
        selectedConversation: Conversation | undefined;
    } = $props();

    let selectedSource = $state("");
    let conversationsLoading = getIsLoading();
    let currentOffset = getCurrentOffset();

    let searchIsLoading = getIsSearchLoading();
    let searchHasMore = getSearchHasMore();

    const sources = [
        { id: "all", name: "All", count: 0 },
        { id: "chatgpt", name: "ChatGPT", count: 0 },
        { id: "claude", name: "Claude", count: 0 },
        { id: "deepseek", name: "DeepSeek", count: 0 },
    ];

    // Initial load if no conversations and more are available
    if (allConversationsStore.length === 0 && getHasMoreConversationsToLoad()) {
        loadConversationsFromBackground();
    }

    function handleLoadMore() {
        if (!conversationsLoading && getHasMoreConversationsToLoad()) {
            loadConversationsFromBackground();
        }
    }

    async function handleSearch(event: Event) {
        if (event instanceof KeyboardEvent && event.key === "Enter") {
            await executeNewSearch(searchQuery);

            // conversationsResult is updated reactively
            if (conversationsResult.length > 0) {
                setSelectedConversation(conversationsResult[0]);
            }
        }
    }

    function handleLoadMoreSearchResultsClick() {
        if (!searchIsLoading && searchHasMore) {
            loadMoreSearchResults();
        }
    }

    async function selectSource(sourceId: string) {
        selectedSource = sourceId;
        setActiveSearchSource(sourceId);
        setCurrentOffset(0);
        setHasMoreConversationsToLoad(true);

        await loadConversationsFromBackground();
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
        class="menu p-4 w-80 bg-base text-base-content border-r flex flex-col
gap-y-8 bg-base-100"
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
        <div class="grow overflow-y-auto">
            <h2 class="font-medium mb-2">Search Result</h2>
            {#if conversationsResult.length === 0 && !searchIsLoading}
                <div class="text-sm opacity-70 p-4 text-center">
                    Search for a keyword in the search bar above...
                </div>
            {:else if conversationsResult.length === 0 && searchIsLoading}
                <div class="text-sm opacity-70 p-4 text-center">
                    Searching...
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each conversationsResult as conversation (conversation.id)}
                        <li>
                            <button
                                class="block p-2 hover:bg-base-300 rounded-lg
      w-full text-left"
                                class:bg-base-200={conversation.id ===
                                    selectedConversation?.id}
                                onclick={() =>
                                    setSelectedConversation(conversation)}
                            >
                                {conversation.title}
                            </button>
                        </li>
                    {/each}
                </ul>
                {#if searchIsLoading && conversationsResult.length > 0}
                    <div class="text-sm opacity-70 p-4 text-center">
                        Loading more results...
                    </div>
                {/if}
                {#if searchHasMore && !searchIsLoading && conversationsResult.length > 0}
                    <button
                        class="btn btn-sm btn-outline w-full mt-2"
                        onclick={handleLoadMoreSearchResultsClick}
                    >
                        Load More Results
                    </button>
                {/if}
                {#if !searchHasMore && conversationsResult.length > 0 && !searchIsLoading}
                    <div class="text-sm opacity-70 p-4 text-center">
                        No more search results.
                    </div>
                {/if}
            {/if}
        </div>
        <!-- Conversation List -->
        <div class="grow overflow-y-auto">
            <h2 class="font-medium mb-2">All Conversations</h2>
            {#if allConversationsStore.length === 0 && !conversationsLoading && !getHasMoreConversationsToLoad()}
                <div class="text-sm opacity-70 p-4 text-center">
                    No conversations found. Try importing some.
                </div>
            {:else if allConversationsStore.length === 0 && conversationsLoading}
                <div class="text-sm opacity-70 p-4 text-center">
                    Loading conversations...
                </div>
            {:else}
                <ul class="space-y-2">
                    {#each allConversationsStore as conversation (conversation.id)}
                        <li>
                            <button
                                class="block p-2 hover:bg-base-300 rounded-lg w-full text-left"
                                class:bg-base-200={conversation.id ===
                                    selectedConversation?.id}
                                onclick={() =>
                                    setSelectedConversation(conversation)}
                            >
                                {conversation.title}
                            </button>
                        </li>
                    {/each}
                </ul>
                {#if conversationsLoading}
                    <div class="text-sm opacity-70 p-4 text-center">
                        Loading more...
                    </div>
                {/if}
                {#if getHasMoreConversationsToLoad() && !conversationsLoading}
                    <button
                        class="btn btn-sm btn-outline w-full mt-2"
                        onclick={handleLoadMore}
                    >
                        Show more...
                    </button>
                {/if}
                {#if !getHasMoreConversationsToLoad() && allConversationsStore.length > 0}
                    <div class="text-sm opacity-70 p-4 text-center">
                        No more conversations.
                    </div>
                {/if}
            {/if}
        </div>

        <ImportForm />
        <div class="justify-self-end self-end">
            <ThemeSwitcher />
        </div>
    </div>
</div>
