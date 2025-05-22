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

chrome.action.onClicked.addListener(async () => {
  // This is an example action; you might use it to open your extension's UI
  // or for testing the offscreen document setup.
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);
  console.log(
    "Background: Action clicked, ensured offscreen document is set up.",
  );
});
