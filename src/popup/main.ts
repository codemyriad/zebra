import { mount } from "svelte";

import App from "./App.svelte";
import "../app.css";

// @ts-ignore
mount(App, { target: document.getElementById("app") });
