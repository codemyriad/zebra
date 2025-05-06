<script lang="ts">
  import { onMount } from 'svelte';

  let messageFromBackground = '';

  onMount(async () => {
    console.log("Zebra Popup App Mounted.");
    try {
      const response = await chrome.runtime.sendMessage({ greeting: "hello from popup" });
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
</script>

<main>
  <h1>Zebra LLM Cache</h1>
  <p>Welcome to your Zebra extension popup!</p>
  {#if messageFromBackground}
    <p>Message from background: <strong>{messageFromBackground}</strong></p>
  {/if}
  <p><em>Check the console for more logs.</em></p>
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
