console.log("Zebra Background Service Worker Started.");

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

let creatingOffscreenDocument: Promise<void> | null = null;

async function hasOffscreenDocument(path: string): Promise<boolean> {
  const offscreenUrl = chrome.runtime.getURL(path);
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });
    return contexts.length > 0;
  } else {
    // Fallback for older Chrome versions (pre-116)
    // @ts-ignore
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
      if (client.url === offscreenUrl && client.type === "window") {
        // Offscreen documents are of type 'window'
        return true;
      }
    }
    return false;
  }
}

async function setupOffscreenDocument(path: string) {
  if (await hasOffscreenDocument(path)) {
    console.log("Background: Offscreen document already exists.");
    return;
  }

  if (creatingOffscreenDocument) {
    console.log("Background: Offscreen document creation already in progress.");
    await creatingOffscreenDocument;
    return;
  }

  console.log("Background: Creating offscreen document.");
  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification:
      "To handle SQLite database operations in a DOM environment for OPFS access.",
  });

  try {
    await creatingOffscreenDocument;
    console.log("Background: Offscreen document created successfully.");
  } catch (error) {
    console.error("Background: Error creating offscreen document:", error);
  } finally {
    creatingOffscreenDocument = null;
  }
}

// Ensure the offscreen document is set up when the service worker starts
// or when it's needed.
setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background: Message received", request);

  if (request.greeting === "hello from popup") {
    sendResponse({ farewell: "goodbye from background" });
    return false;
  }

  const dbOperations = [
    "SAVE_CONVERSATION",
    "GET_CONVERSATIONS",
    "GET_CONVERSATION",
    "DELETE_CONVERSATION",
    "EXECUTE_QUERY",
  ];

  if (request && request.type && dbOperations.includes(request.type)) {
    setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH)
      .then(() => {
        chrome.runtime.sendMessage(
          request, // Forward the original request
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Background: Error sending/receiving message to/from offscreen:",
                chrome.runtime.lastError.message,
                "Original request:",
                request,
              );
              sendResponse({
                success: false,
                error: `Failed to communicate with
offscreen document: ${chrome.runtime.lastError.message}`,
              });
            } else {
              sendResponse(response);
            }
          },
        );
      })
      .catch((err) => {
        console.error(
          "Background: Failed to setup offscreen document before sending message:",
          err,
        );
        sendResponse({
          success: false,
          error: "Failed to ensure offscreen document is ready.",
        });
      });
    return true;
  } else {
    console.warn("Background: Unknown operation or non-DB message", request);
    sendResponse({ success: false, error: "Background: Unknown operation" });
    return false;
  }
});

chrome.action.onClicked.addListener(async () => {
  // This is an example action; you might use it to open your extension's UI
  // or for testing the offscreen document setup.
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
  console.log(
    "Background: Action clicked, ensured offscreen document is set up.",
  );
});
