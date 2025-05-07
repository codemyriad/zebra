<script lang="ts">
    import type { Conversation, Message } from "../lib/types/content";
    let selectedFile: File | null = null;
    let jsonData: object;
    let selectedProvider: string = "chatgpt";
    let fileWarning: string = "";
    let providerWarning: string = "";
    let conv: Conversation[] = [];
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
            conv = convertClaudeToDesiredFormat(
                jsonData as ClaudeConversation[],
            );

            console.log("Converted File content:", conv);

            // Further processing of jsonData can happen here
        } catch (error) {
            console.error("Error reading file:", error);
            fileWarning = "Failed to read the file.";
        }
    }

    // Define types for the Claude API response format
    interface ClaudeContentBlock {
        start_timestamp?: string;
        stop_timestamp?: string;
        type: string;
        text?: string;
        citations?: any[];
    }

    interface ClaudeChatMessage {
        uuid: string;
        text?: string;
        content?: ClaudeContentBlock[];
        sender: "human" | "assistant";
        created_at: string;
        updated_at: string;
        attachments?: any[];
        files?: any[];
    }

    interface ClaudeConversation {
        uuid: string;
        name: string;
        created_at: string;
        updated_at: string;
        account?: {
            uuid: string;
        };
        chat_messages: ClaudeChatMessage[];
    }

    /**
     * Converts Claude API conversation data to the desired output format
     * @param claudeData - Array of Claude conversation objects
     * @returns Array of conversations in the desired format
     */
    function convertClaudeToDesiredFormat(
        claudeData: ClaudeConversation[],
    ): Conversation[] {
        return claudeData.map((conversation) => {
            // Extract basic conversation metadata
            const result: Conversation = {
                id: conversation.uuid,
                title: conversation.name || "Untitled Conversation",
                created_at: new Date(conversation.created_at).getTime(),
                updated_at: new Date(conversation.updated_at).getTime(),
                source: "Claude",
                messages: [],
            };

            // Process messages
            if (
                conversation.chat_messages &&
                Array.isArray(conversation.chat_messages)
            ) {
                result.messages = conversation.chat_messages.map((msg) => {
                    // Determine message content
                    let content = "";

                    // Handle different content structures
                    if (msg.text) {
                        // Direct text field
                        content = msg.text;
                    } else if (msg.content && Array.isArray(msg.content)) {
                        // Content array with text blocks
                        content = msg.content
                            .filter(
                                (block) => block.type === "text" && block.text,
                            )
                            .map((block) => block.text)
                            .join("\n");
                    }

                    const message: Message = {
                        created_at: new Date(msg.created_at).getTime(),
                        author: msg.sender === "human" ? "user" : "assistant",
                        content: content,
                    };

                    return message;
                });
            }

            return result;
        });
    }

    /**
     * Process a single Claude conversation
     * @param conversation - Single Claude conversation object
     * @returns Conversation in the desired format
     */
    function processSingleConversation(
        conversation: ClaudeConversation,
    ): Conversation {
        return convertClaudeToDesiredFormat([conversation])[0];
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

<main>
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

        {#each conv as convo}
            <div class="messages">
                <div>Created At: {convo.created_at}</div>
                <div>Id: {convo.id}</div>
                <div>Messages:</div>
                {#each convo.messages as msg}
                    <p>{msg.author}</p>
                    <p>{msg.content}</p>
                    <p>{msg.created_at}</p>
                {/each}
                <div>Source: {convo.source}</div>
                <div>Title: {convo.title}</div>
                <div>Updated At: {convo.updated_at}</div>
            </div>
        {/each}

        <button type="submit">Import</button>
    </form>

    <nav>
        <a href="options.html">Go back to Options</a>
    </nav>
</main>

<style>
    main {
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
</style>
