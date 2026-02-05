/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference path="./types/global.d.ts" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// This export is needed to make the file a module
export {};