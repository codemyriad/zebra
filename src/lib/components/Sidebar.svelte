<script lang="ts">
  let searchQuery = "";

  let selectedSource = $state("all");

  const sources = [
    { id: "all", name: "All Sources", count: 0 },
    { id: "chatgpt", name: "ChatGPT", count: 0 },
    { id: "claude", name: "Claude", count: 0 },
  ];

  const conversations: any[] = [
    // This will be populated from the database
    // For now, it's empty to show the empty state
  ];

  function handleSearch(event: Event) {
    if (event instanceof KeyboardEvent && event.key === "Enter") {
      // TODO: Implement search functionality
      console.log(`Searching for: ${searchQuery}`);
    }
  }

  function selectSource(sourceId: string) {
    selectedSource = sourceId;
    // TODO: Filter conversations by source
    console.log(`Selected source: ${sourceId}`);
  }
</script>

<div class="drawer-side z-10">
  <label for="options-drawer" aria-label="close sidebar" class="drawer-overlay"
  ></label>

  <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
    <!-- Sidebar content here -->
    <div class="flex items-center mb-6">
      <div class="w-12 h-12 mr-3">
        <img src="/assets/logo.svg" alt="Zebra Logo" class="w-full h-full" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-primary">Zebra Cache</h2>
        <p class="text-xs opacity-70">LLM Conversation History</p>
      </div>
    </div>

    <!-- Search -->
    <div class="form-control mb-6">
      <div class="input-group">
        <input
          type="text"
          placeholder="Search conversations..."
          class="input input-bordered w-full"
          bind:value={searchQuery}
          onkeydown={handleSearch}
        />
        <button class="btn btn-square">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Source Filter -->
    <div class="mb-4">
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

    <!-- Conversation List -->
    <div>
      <h3 class="font-medium mb-2">Conversations</h3>
      {#if conversations.length === 0}
        <div class="text-sm opacity-70 p-4 text-center">
          No conversations found
        </div>
      {:else}
        <ul class="space-y-2">
          {#each conversations as conversation}
            <li>
              <a class="block p-2 hover:bg-base-300 rounded-lg">
                {conversation.title}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
