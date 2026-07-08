import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { setImageProxyBase } from "./lib/imageCache";
import "./styles.css";

function mount() {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// Resolve the local image-cache base before the first paint so posters use the
// on-disk cache from the very first render. Never block or break the UI if the
// bridge is slow or unavailable — always mount.
const baseReady = window.moPlayer?.stream?.base?.() ?? Promise.resolve("");
baseReady
  .then((base) => setImageProxyBase(base))
  .catch(() => undefined)
  .finally(mount);

