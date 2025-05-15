<script lang="ts">
    import type { Conversation, Message } from "../types/content";
    import {
        conversations,
        addNewConversationAndRefresh,
    } from "../state/conversations.svelte";
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

            for (const convo of convertedConvs) {
                chrome.runtime.sendMessage(
                    {
                        type: "SAVE_CONVERSATION",
                        conversation: convo,
                    },
                    (response) => {
                        if (response.success) {
                            console.log("Conversation saved successfully");
                        } else {
                            console.error(
                                "Failed to save conversation:",
                                response.error,
                            );
                        }
                    },
                );
            }

            chrome.runtime.sendMessage(
                {
                    type: "GET_CONVERSATIONS",
                },
                async (response) => {
                    console.log({ response });
                    if (response.success) {
                        await addNewConversationAndRefresh(
                            response.conversations,
                        );
                        console.log("Conversations:", response.conversations);
                    }
                },
            );
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

    interface ChatGPTMessage {
        id: string;
        author: {
            role: "user" | "assistant" | "system";
        };
        create_time: number;
        content: {
            content_type: string;
            parts?: string[];
            text?: string;
            thoughts?: Array<{
                content: string;
            }>;
        };
        metadata?: {
            model_slug?: string;
        };
    }

    interface ChatGPTConversation {
        title: string;
        create_time: number;
        update_time: number;
        mapping: {
            [key: string]: {
                message: ChatGPTMessage;
                parent: string | null;
                children: string[];
            };
        };
        current_node: string;
    }

    function convertChatGPTToDesiredFormat(
        chatGPTData: ChatGPTConversation[],
    ): Conversation[] {
        return chatGPTData.map((conversation) => {
            // Extract basic conversation metadata
            const result: Conversation = {
                id:
                    conversation.current_node ||
                    Object.keys(conversation.mapping)[0],
                title: conversation.title || "Untitled Conversation",
                created_at: conversation.create_time * 1000, // Convert to milliseconds
                updated_at: conversation.update_time * 1000,
                source: "ChatGPT",
                messages: [],
            };

            // Build message chain by following parent->child relationships
            const messages: Message[] = [];
            const visitedNodes = new Set<string>();

            // Helper function to traverse the message tree
            const traverseMessages = (nodeId: string) => {
                if (visitedNodes.has(nodeId) || !conversation.mapping[nodeId])
                    return;

                visitedNodes.add(nodeId);
                const node = conversation.mapping[nodeId];

                if (node.message) {
                    // Determine message content
                    let content = "";
                    const msgContent = node.message.content;

                    if (msgContent.parts && Array.isArray(msgContent.parts)) {
                        content = msgContent.parts.join("\n");
                    } else if (msgContent.text) {
                        content = msgContent.text;
                    } else if (
                        msgContent.thoughts &&
                        Array.isArray(msgContent.thoughts)
                    ) {
                        content = msgContent.thoughts
                            .map((t) => t.content)
                            .join("\n");
                    }

                    if (content) {
                        messages.push({
                            created_at: node.message.create_time * 1000,
                            author:
                                node.message.author.role === "user"
                                    ? "user"
                                    : "assistant",
                            content: content,
                            // model: node.message.metadata?.model_slug,
                        });
                    }
                }

                // Process children
                node.children.forEach((childId) => traverseMessages(childId));
            };

            // Find root nodes (nodes with no parent or parent not in mapping)
            const rootNodes = Object.entries(conversation.mapping)
                .filter(
                    ([id, node]) =>
                        !node.parent || !conversation.mapping[node.parent],
                )
                .map(([id]) => id);

            // Traverse from all root nodes
            rootNodes.forEach((rootId) => traverseMessages(rootId));

            // Sort messages by timestamp (since tree traversal might not maintain order)
            result.messages = messages.sort(
                (a, b) => a.created_at - b.created_at,
            );

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

<style>
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
</style>
