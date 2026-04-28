/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EASTER_EGG_VIDEO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
