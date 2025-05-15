<script lang="ts">
    import type {
        ChatGPTConversation,
        ClaudeConversation,
        Conversation,
        Message,
    } from "../types/content";
    import {
        conversations,
        loadConversationsFromBackground,
        addNewConversationsAndRefresh,
    } from "../state/conversations.svelte";
    import {
        convertChatGPTToDesiredFormat,
        convertClaudeToDesiredFormat,
    } from "../utils";
    let selectedFile: File | null = null;
    let jsonData: object;
    let selectedProvider: string = "chatgpt";
    let fileWarning: string = "";
    let providerWarning: string = "";

    async function processForm(e: Event) {
        e.preventDefault();
        fileWarning = ""; // Clear previous warnings
        providerWarning = ""; // Clear previous warnings

        console.log("Processing form");
        if (!selectedFile) {
            console.error("No file selected");
            fileWarning = "Please select a file to import.";
        }
        if (!selectedProvider) {
            console.error("No provider selected");
            providerWarning = "Please select a provider.";
        }

        if (fileWarning || providerWarning) {
            return; // Stop if there are any warnings
        }

        console.log("Selected provider:", selectedProvider);

        try {
            jsonData = JSON.parse(await selectedFile!.text());

            console.log("File content:", jsonData);
            let convertedConvs =
                selectedProvider === "claude"
                    ? convertClaudeToDesiredFormat(
                          jsonData as ClaudeConversation[],
                      )
                    : convertChatGPTToDesiredFormat(
                          jsonData as ChatGPTConversation[],
                      );

            console.log("Converted File content:", convertedConvs);

            await addNewConversationsAndRefresh(convertedConvs);
        } catch (error) {
            console.error("Error reading file:", error);
            fileWarning = "Failed to read the file.";
        }
    }

    /**

    // For an array of conversations
    const convertedData: Conversation[] = convertClaudeToDesiredFormat(claudeApiData);

    // For a single conversation
    const singleConversation: Conversation = processSingleConversation(claudeApiData[0]);

    // To save as JSON
    const jsonOutput: string = JSON.stringify(convertedData, null, 2);
    */

    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            selectedFile = target.files[0];
            fileWarning = ""; // Clear warning when a file is selected
        } else {
            selectedFile = null;
        }
    }

    function handleProviderChange() {
        providerWarning = ""; // Clear warning when a provider is selected
    }
</script>

<div>
    <h1>Import Your Chats</h1>

    <form on:submit={processForm}>
        <fieldset>
            <legend>Provider:</legend>
            <div>
                <input
                    type="radio"
                    id="chatgpt"
                    value="chatgpt"
                    name="provider"
                    bind:group={selectedProvider}
                    on:change={handleProviderChange}
                />
                <label for="chatgpt">ChatGPT</label>
            </div>
            <div>
                <input
                    type="radio"
                    id="claude"
                    value="claude"
                    name="provider"
                    bind:group={selectedProvider}
                    on:change={handleProviderChange}
                />
                <label for="claude">Claude</label>
            </div>
            {#if providerWarning}
                <p class="warning">{providerWarning}</p>
            {/if}
        </fieldset>

        <fieldset>
            <legend>Upload File:</legend>
            <div>
                <label for="file-upload">Choose JSON file:</label>
                <input
                    type="file"
                    id="file-upload"
                    accept="application/json, text/json"
                    on:change={handleFileChange}
                />
                {#if fileWarning}
                    <p class="warning">{fileWarning}</p>
                {/if}
            </div>
        </fieldset>

        <button type="submit">Import</button>
    </form>

    <nav>
        <a href="options.html">Go back to Options</a>
    </nav>
</div>

<!-- <style>
    div {
        font-family: sans-serif;
        max-width: 600px;
        margin: 2em auto;
        padding: 1em;
        border: 1px solid #eee;
        border-radius: 5px;
    }

    h1 {
        color: #333;
        text-align: center;
        margin-bottom: 1em;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1.5em;
    }

    fieldset {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 1em;
    }

    legend {
        font-weight: bold;
        padding: 0 0.5em;
    }

    input[type="radio"] {
        margin-right: 0.5em;
    }

    label {
        margin-right: 1em;
    }

    input[type="file"] {
        margin-top: 0.5em;
    }

    button[type="submit"] {
        padding: 0.8em 1.5em;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1em;
        align-self: center;
    }

    button[type="submit"]:hover {
        background-color: #0056b3;
    }

    nav {
        margin-top: 2em;
        text-align: center;
    }

    nav a {
        color: #007bff;
        text-decoration: none;
    }

    nav a:hover {
        text-decoration: underline;
    }

    .warning {
        color: red;
        font-size: 0.9em;
        margin-top: 0.5em;
    }
    .messages {
        border-top: solid;
        border-bottom: solid;
    }
</style> -->
