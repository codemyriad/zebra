<script lang="ts">
    import { onMount } from "svelte";
    import ThemeSwitcher from "../lib/components/ThemeSwitcher.svelte";

    let messageFromBackground = $state("");
    let searchQuery = $state("");

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

    function openOptionsPage(query = "") {
        // This will open options.html in a new tab with optional search query
        const url = chrome.runtime.getURL("src/options/options.html");
        const fullUrl = query
            ? `${url}?search=${encodeURIComponent(query)}`
            : url;
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
            <img
                src="/assets/logo.svg"
                alt="Zebra Logo"
                class="w-full h-full"
            />
        </div>
        <div class="flex-1">
            <h1 class="text-2xl font-bold text-primary">Zebra LLM Cache</h1>
        </div>
    </div>

    <div class="mb-6">
        <div class="join w-full">
            <input
                type="text"
                placeholder="Search convo's"
                class="input input-bordered join-item flex-1"
                bind:value={searchQuery}
                onkeydown={handleKeyDown}
            />
            <button class="btn join-item btn-primary" onclick={handleSearch}>
                Enter
            </button>
        </div>
    </div>

    <div class="divider">Or</div>

    <button
        class="btn btn-outline btn-primary w-full"
        onclick={() => openOptionsPage()}
    >
        View all
    </button>

    <button
        class="btn btn-outline btn-primary w-full"
        onclick={async () => {
            try {
                const [activeTab] = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });

                if (activeTab && activeTab.id && activeTab.url) {
                    if (
                        activeTab.url.startsWith("https://chat.deepseek.com/")
                    ) {
                        const responseFromContentScript =
                            await chrome.tabs.sendMessage(activeTab.id, {
                                action: "get_localStorage_token",
                                key: "userToken",
                            });

                        if (
                            responseFromContentScript &&
                            responseFromContentScript.token !== undefined
                        ) {
                            const userToken = responseFromContentScript.token;
                            chrome.runtime.sendMessage(
                                {
                                    action: "download_conversation_history_deepseek",
                                    token: JSON.parse(userToken).value,
                                },
                                (responseFromBackground) => {
                                    if (
                                        responseFromBackground &&
                                        responseFromBackground.success
                                    ) {
                                        console.log(
                                            "DeepseekConversation downloaded successfully",
                                        );
                                    } else {
                                        console.error(
                                            "Failed to download Deepseek conversation:",
                                            responseFromBackground?.error,
                                        );
                                    }
                                },
                            );
                        } else {
                            console.error(
                                "Could not retrieve token from active tab's localStorage. Response:",
                                responseFromContentScript,
                            );
                        }
                    } else if (
                        activeTab.url.startsWith("https://chatgpt.com/")
                    ) {
                        chrome.runtime.sendMessage(
                            {
                                action: "download_conversation_history",
                            },
                            (responseFromBackground) => {
                                if (
                                    responseFromBackground &&
                                    responseFromBackground.success
                                ) {
                                    console.log(
                                        "ChatGPTConversation downloaded successfully",
                                    );
                                } else {
                                    console.error(
                                        "Failed to download ChatGPT conversation:",
                                        responseFromBackground?.error,
                                    );
                                }
                            },
                        );
                    }
                } else {
                    console.error("Could not get active tab.");
                }
            } catch (error) {
                console.error("Error getting token from active tab:", error);
                // This error often means the content script isn't injected or  didn't respond.
                if (
                    error.message.includes("Could not establish connection") ||
                    error.message.includes("No matching signature")
                ) {
                    console.warn(
                        "Ensure a content script is running on the active tab and listening for 'get_localStorage_token'.",
                    );
                }
            }
        }}
    >
        Sync conversations
    </button>

    <!-- Spacer to push footer to bottom -->
    <div class="flex-grow"></div>

    <!-- Footer with theme switcher -->
    <div
        class="flex flex-row justify-between items-center mt-4 pt-4 border-t border-base-300"
    >
        <ThemeSwitcher />

        {#if messageFromBackground}
            <div class="text-xs text-opacity-60">
                <span>Debug: {messageFromBackground}</span>
            </div>
        {/if}
    </div>
</main>
