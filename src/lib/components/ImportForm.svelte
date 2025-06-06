<script lang="ts">
    import type {
        ChatGPTConversation,
        ClaudeConversation,
        Conversation,
        DeepSeekConversationWithMapping,
        Message,
    } from "../types/content";
    import {
        conversations,
        loadConversationsFromBackground,
        addNewConversationsAndRefresh,
    } from "../state/conversations.svelte";
    import {
        BlobReader,
        BlobWriter,
        TextWriter,
        ZipReader,
    } from "@zip.js/zip.js";
    import {
        convertChatGPTToDesiredFormat,
        convertClaudeToDesiredFormat,
        convertDeepSeekToDesiredFormat,
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

        try {
            jsonData = JSON.parse(await selectedFile!.text());

            let convertedConvs = [];
            if (selectedProvider === "claude") {
                convertedConvs = convertClaudeToDesiredFormat(
                    jsonData as ClaudeConversation[],
                );
            } else if (selectedProvider === "chatgpt") {
                convertedConvs = convertChatGPTToDesiredFormat(
                    jsonData as ChatGPTConversation[],
                );
            } else {
                convertedConvs = convertDeepSeekToDesiredFormat(
                    jsonData as DeepSeekConversationWithMapping[],
                );
            }

            console.log("Converted File content:", convertedConvs);

            await addNewConversationsAndRefresh(convertedConvs);
        } catch (error) {
            console.error("Error reading file:", error);
            fileWarning =
                "Failed to read the file. Ensure it is a valid JSON  format.";
        }
    }

    async function processZipFile(zipFile: File) {
        if (!zipFile.name.endsWith(".zip")) {
            fileWarning = "Invalid file format. Please select a ZIP file.";
            return;
        }

        const blobReader = new BlobReader(zipFile);
        const zipReader = new ZipReader(blobReader);
        try {
            const entries = await zipReader.getEntries();
            for (const entry of entries) {
                const filename = entry.filename.toLowerCase();
                if (filename === "conversations.json") {
                    const content = await entry.getData(new TextWriter());
                    const jsonData = JSON.parse(content);

                    /** @TODO handle other sources */
                    const convertedConvs = convertChatGPTToDesiredFormat(
                        jsonData as ChatGPTConversation[],
                    );
                    await addNewConversationsAndRefresh(convertedConvs);
                } else if (
                    filename.endsWith(".jpeg") ||
                    filename.endsWith(".jpg")
                ) {
                    const imageBlob = await entry.getData(
                        new BlobWriter("image/jpeg"),
                    );
                    console.log(`Extracted JPEG ${entry.filename}:`, imageBlob);
                    // will then create an Object URL
                    chrome.runtime.sendMessage({
                        target: "offscreen",
                        type: "SAVE_IMAGE",
                        filename: entry.filename,
                        data: imageBlob,
                        mime_type: "image/jpeg",
                    });
                } else if (filename.endsWith(".png")) {
                    const imageBlob = await entry.getData(
                        new BlobWriter("image/png"),
                    );
                    const arrayBuffer = await imageBlob.arrayBuffer();
                    const arrayBufferView = new Uint8Array(arrayBuffer);
                    console.log(
                        `Extracted PNG ${entry.filename}:`,
                        arrayBufferView,
                    );

                    chrome.runtime.sendMessage({
                        target: "offscreen",
                        type: "SAVE_IMAGE",
                        filename: entry.filename,
                        data: arrayBufferView,
                        mime_type: "image/png",
                    });
                }
            }
            fileWarning =
                "Finished processing ZIP file. Check console for details.";
        } catch (error) {
            fileWarning = `Error processing ZIP file: ${error.message}`;
            console.error("Error processing ZIP file:", error);
        } finally {
            await zipReader.close();
        }
    }
    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            selectedFile = target.files[0];
            fileWarning = ""; // Clear warning when a file is selected

            if (selectedFile.type === "application/zip") {
                processZipFile(selectedFile);
            }
        } else {
            selectedFile = null;
        }
    }

    function handleProviderChange() {
        providerWarning = ""; // Clear warning when a provider is selected
    }
</script>

<div class="h-full">
    <form on:submit={processForm} class="space-y-6">
        <fieldset class="p-4 border border-base-300 rounded-box space-y-2">
            <legend class="text-lg font-medium px-2">Provider:</legend>
            <div class="form-control">
                <label class="label cursor-pointer justify-start gap-2">
                    <input
                        class="radio radio-primary"
                        type="radio"
                        value="chatgpt"
                        name="provider"
                        bind:group={selectedProvider}
                        on:change={handleProviderChange}
                    />
                    <span class="label-text">ChatGPT</span>
                </label>
            </div>
            <div class="form-control">
                <label class="label cursor-pointer justify-start gap-2">
                    <input
                        class="radio radio-primary"
                        type="radio"
                        value="claude"
                        name="provider"
                        bind:group={selectedProvider}
                        on:change={handleProviderChange}
                    />
                    <span class="label-text">Claude</span>
                </label>
            </div>
            <div class="form-control">
                <label class="label cursor-pointer justify-start gap-2">
                    <input
                        class="radio radio-primary"
                        type="radio"
                        value="deepseek"
                        name="provider"
                        bind:group={selectedProvider}
                        on:change={handleProviderChange}
                    />
                    <span class="label-text">DeepSeek</span>
                </label>
            </div>
            {#if providerWarning}
                <div role="alert" class="alert alert-warning p-2 mt-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="stroke-current shrink-0 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0
4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732
4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        /></svg
                    >
                    <span class="text-sm">{providerWarning}</span>
                </div>
            {/if}
        </fieldset>

        <fieldset class="p-4 border border-base-300 rounded-box space-y-2">
            <legend class="text-lg font-medium px-2">Upload JSON File</legend>
            <div class="form-control w-full">
                <input
                    class="file-input file-input-bordered file-input-primary
w-full"
                    type="file"
                    id="file-upload"
                    accept=".zip, application/json, text/json"
                    on:change={handleFileChange}
                />
                {#if fileWarning}
                    <div role="alert" class="alert alert-error p-2 mt-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="stroke-current shrink-0 h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 14l2-2m0
0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            /></svg
                        >
                        <span class="text-sm">{fileWarning}</span>
                    </div>
                {/if}
            </div>
            <button class="btn btn-primary mt-4 w-full" type="submit"
                >Import</button
            >
        </fieldset>
    </form>
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
