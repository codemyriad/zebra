<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "../lib/components/Sidebar.svelte";
  import ThemeSwitcher from "../lib/components/ThemeSwitcher.svelte";

  let searchQuery = $state("");

  onMount(() => {
    // Get search query from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchQuery = urlParams.get("search");

    if (urlSearchQuery) {
      searchQuery = urlSearchQuery;
      // TODO: Trigger search with the query
      console.log(`Searching for: ${searchQuery}`);
    }
  });
</script>

<div class="drawer lg:drawer-open">
  <input id="options-drawer" type="checkbox" class="drawer-toggle" />

  <div class="drawer-content flex flex-col p-6">
    <!-- Page content here -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-primary">Conversations</h1>
      <label
        for="options-drawer"
        class="btn btn-primary drawer-button lg:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </label>
    </div>

    <div
      class="card bg-base-200 shadow-xl p-6 min-h-[70vh] flex items-center justify-center"
    >
      <div class="text-center py-8 text-base-content/60 max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-16 h-16 mx-auto mb-4 opacity-50"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
          />
        </svg>
        <p>
          No conversations found. Start chatting with an LLM to see your history
          here.
        </p>
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <ThemeSwitcher />
    </div>
  </div>

  <Sidebar {searchQuery} />
</div>
