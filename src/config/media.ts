const configuredEasterEggVideoUrl =
  import.meta.env.VITE_EASTER_EGG_VIDEO_URL?.trim() ?? "";

export const easterEggVideoUrl =
  configuredEasterEggVideoUrl.length > 0
    ? configuredEasterEggVideoUrl
    : null;
