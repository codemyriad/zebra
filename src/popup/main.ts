import '../app.css';
import App from "./App.svelte";

// In Svelte 5, we need to create the component differently
const target = document.getElementById("app");

if (target) {
  new App({
    target
  });
}
