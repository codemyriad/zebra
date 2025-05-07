<script lang="ts">
	import { onMount } from "svelte";
	import markdownit from "markdown-it";

	let messageFromBackground = "";
	let isDownloading = false;
	let errorStatus = "";

	onMount(async () => {
		console.log("Zebra Popup App Mounted.");
		try {
			const response = await chrome.runtime.sendMessage({
				greeting: "hello from popup"
			});
			console.log("Response from background in popup:", response);
			if (response && response.farewell) {
				messageFromBackground = response.farewell;
			} else {
				messageFromBackground = "No response or unexpected response format.";
			}
		} catch (error) {
			console.error("Error sending message from popup:", error);
			messageFromBackground = `Error: ${error.message}`;
			if (chrome.runtime.lastError) {
				console.error("Chrome runtime error:", chrome.runtime.lastError.message);
				messageFromBackground += ` | Chrome Error: ${chrome.runtime.lastError.message}`;
			}
		}
	});

	function openOptionsPage() {
		// This will open options.html in a new tab.
		// Ensure options.html is included in your Vite build and manifest.
		chrome.tabs.create({
			url: chrome.runtime.getURL("src/options/options.html")
		});
	}

	async function downloadConversationHistory() {
		chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
			const [tab] = tabs;
			isDownloading = true;
			errorStatus = "";
			try {
				await chrome.tabs.sendMessage(tab.id!, { action: "download_conversation_history" });
			} catch (error: any) {
				errorStatus = `Error downloading: ${error.message}`;
			} finally {
				isDownloading = false;
			}
		});
	}
</script>

<main>
	<h1>Zebra LLM Cache</h1>
	<p>Welcome to your Zebra extension popup!</p>
	{#if messageFromBackground}
		<p>Message from background: <strong>{messageFromBackground}</strong></p>
	{/if}
	{@html markdownit().render("# Marked in Node.js\n\nRendered by **marked**.")}

	<p><em>Check the console for more logs.</em></p>

	<!-- Add a button to open the options page -->
	<button on:click={openOptionsPage} style="margin-top: 1em;"> Open Options Page </button>

	<!-- Add a button to download conversation history -->
	<button on:click={downloadConversationHistory} style="margin-top: 1em; display: block; width: 100%;" disabled={isDownloading}>
		{isDownloading ? "Downloading..." : "Download Conversation History"}
	</button>

	{#if errorStatus}
		<p style="margin-top: 0.5em; font-size: 0.9em;">{errorStatus}</p>
	{/if}
</main>

<style>
	main {
		font-family: sans-serif;
		text-align: center;
		padding: 1em;
		max-width: 240px;
	}
	h1 {
		color: #333;
		text-transform: uppercase;
		font-size: 1.5em;
		font-weight: 200;
	}
</style>
