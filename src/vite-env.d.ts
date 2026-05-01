/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EASTER_EGG_VIDEO_URL?: string;
  readonly VITE_EASTER_EGG_LOTTERY_RESULT?: string;
  readonly VITE_EASTER_EGG_LOTTERY_AWARD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
