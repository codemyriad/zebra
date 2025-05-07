<script lang="ts">
  import { onMount } from "svelte";

  // Available themes from DaisyUI
  let themes = ["light", "dark", "cupcake"];
  let currentTheme = $state("light");

  onMount(async () => {
    // Try to get saved theme from storage
    try {
      const result = await chrome.storage.sync.get("theme");
      currentTheme = result.theme || "light";
      applyTheme(currentTheme);
    } catch (error) {
      console.error("Error loading theme:", error);
      currentTheme = "light";
      applyTheme(currentTheme);
    }
  });

  function applyTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  async function changeTheme(theme: string) {
    currentTheme = theme;
    applyTheme(theme);

    // Save theme preference
    try {
      await chrome.storage.sync.set({ theme });
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  }
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-5 h-5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  </div>
  <ul
    class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-4"
  >
    {#each themes as theme}
      <li>
        <button
          class="flex items-center gap-2"
          class:active={currentTheme === theme}
          on:click={() => changeTheme(theme)}
        >
          <span class="capitalize">{theme}</span>
          {#if currentTheme === theme}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</div>
