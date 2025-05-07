<script lang="ts">
    import { onMount } from "svelte";
    import ThemeSwitcher from "./components/ThemeSwitcher.svelte";

    let messageFromBackground = "";
    let searchQuery = "";

    onMount(() => {
        console.log("Zebra Popup App Mounted.");
        try {
            chrome.runtime.sendMessage({
                greeting: "hello from popup",
            }).then(response => {
                console.log("Response from background in popup:", response);
                if (response && response.farewell) {
                    messageFromBackground = response.farewell;
                } else {
                    messageFromBackground =
                        "No response or unexpected response format.";
                }
            }).catch(error => {
                console.error("Error sending message from popup:", error);
                messageFromBackground = `Error: ${error.message}`;
                if (chrome.runtime.lastError) {
                    console.error(
                        "Chrome runtime error:",
                        chrome.runtime.lastError.message,
                    );
                    messageFromBackground += ` | Chrome Error: ${chrome.runtime.lastError.message}`;
                }
            });
        } catch (error) {
            console.error("Error sending message from popup:", error);
            messageFromBackground = `Error: ${error.message}`;
            if (chrome.runtime.lastError) {
                console.error(
                    "Chrome runtime error:",
                    chrome.runtime.lastError.message,
                );
                messageFromBackground += ` | Chrome Error: ${chrome.runtime.lastError.message}`;
            }
        }
    });

    function openOptionsPage(query = "") {
        // This will open options.html in a new tab with optional search query
        const url = chrome.runtime.getURL("src/options/options.html");
        const fullUrl = query ? `${url}?search=${encodeURIComponent(query)}` : url;
        chrome.tabs.create({ url: fullUrl });
    }

    function handleSearch() {
        if (searchQuery.trim()) {
            openOptionsPage(searchQuery);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            handleSearch();
        }
    }
</script>

<main class="p-4 max-w-md mx-auto bg-base-100">
    <div class="flex items-center mb-6">
        <div class="w-16 h-16 mr-4">
            <img src="/logo.svg" alt="Zebra Logo" class="w-full h-full" />
        </div>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-primary">Zebra LLM Cache</h1>
            <div class="flex justify-end">
                <ThemeSwitcher />
            </div>
        </div>
    </div>

    <div class="mb-6">
        <div class="join w-full">
            <input 
                type="text" 
                placeholder="Search convo's" 
                class="input input-bordered join-item flex-1" 
                bind:value={searchQuery}
                on:keydown={handleKeyDown}
            />
            <button 
                class="btn join-item btn-primary" 
                on:click={handleSearch}
            >
                Enter
            </button>
        </div>
    </div>

    <div class="divider">Or</div>

    <button 
        class="btn btn-outline btn-primary w-full" 
        on:click={() => openOptionsPage()}
    >
        View all
    </button>

    {#if messageFromBackground}
        <div class="mt-4 text-xs text-opacity-60">
            <span>Debug: {messageFromBackground}</span>
        </div>
    {/if}
</main>
