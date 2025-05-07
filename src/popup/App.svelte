<script lang="ts">
    import { onMount } from "svelte";

    let messageFromBackground = "";

    onMount(async () => {
        console.log("Zebra Popup App Mounted.");
        try {
            const response = await chrome.runtime.sendMessage({
                greeting: "hello from popup",
            });
            console.log("Response from background in popup:", response);
            if (response && response.farewell) {
                messageFromBackground = response.farewell;
            } else {
                messageFromBackground =
                    "No response or unexpected response format.";
            }
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

    function openOptionsPage() {
        // This will open options.html in a new tab.
        // Ensure options.html is included in your Vite build and manifest.
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/options/options.html"),
        });
    }
</script>

<main class="p-4 max-w-md mx-auto bg-base-100 text-center">
    <h1 class="text-2xl font-bold mb-4 text-primary">Zebra LLM Cache</h1>
    <p class="mb-4">Welcome to your Zebra extension popup!</p>
    {#if messageFromBackground}
        <div class="alert alert-info mb-4">
            <span>Message from background: <strong>{messageFromBackground}</strong></span>
        </div>
    {/if}
    <p class="text-sm italic mb-4">Check the console for more logs.</p>

    <!-- Add a button to open the options page -->
    <button on:click={openOptionsPage} class="btn btn-primary">
        Open Options Page
    </button>
</main>
