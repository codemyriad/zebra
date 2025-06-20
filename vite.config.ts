import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content_chatgpt: resolve(__dirname, "src/content/chatgpt.ts"),
        content_deepseek: resolve(__dirname, "src/content/deepseek.ts"),
        content_claude: resolve(__dirname, "src/content/claude.ts"),
        options: resolve(__dirname, "src/options/options.html"),
        app: resolve(__dirname, "src/app.css"),
        offscreen_document: resolve(__dirname, "src/offscreen/index.ts"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    emptyOutDir: true, // Important for Chrome extensions to clear out old files
  },
  publicDir: "public",
});
