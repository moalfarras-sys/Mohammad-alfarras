/// <reference types="vite/client" />

import type { MoPlayerApi } from "./shared/types";

declare global {
  interface Window {
    moPlayer: MoPlayerApi;
  }
}

export {};
