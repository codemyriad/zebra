# Zebra

Zebra is a browser extension that caches conversations with LLMs (chatgpt and claude) and stores them locally.

## Development

This guide will help you get the Zebra extension running locally for development.

### Prerequisites

*   Node.js (latest LTS version recommended)
*   pnpm (https://pnpm.io/installation)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd zebra-extension # Or your project's directory name
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Running in Development Mode

This command will start the Vite development server, which will watch for file changes and rebuild the extension automatically.

```bash
pnpm dev
```

### Building for Production

This command will create an optimized production build of the extension in the `dist/` directory.

```bash
pnpm build
```

### Loading the Extension in Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" using the toggle switch in the top right corner.
3.  Click on the "Load unpacked" button.
4.  Select the `dist` directory from your project folder.

The Zebra extension icon should now appear in your Chrome toolbar.
