const configuredEasterEggVideoUrl =
  import.meta.env.VITE_EASTER_EGG_VIDEO_URL?.trim() ?? "";
const configuredEasterEggLotteryResult =
  import.meta.env.VITE_EASTER_EGG_LOTTERY_RESULT?.trim() ?? "";
const configuredEasterEggLotteryAward =
  import.meta.env.VITE_EASTER_EGG_LOTTERY_AWARD?.trim() ?? "";

export const easterEggVideoUrl =
  configuredEasterEggVideoUrl.length > 0
    ? configuredEasterEggVideoUrl
    : null;

export const easterEggLotteryResult =
  configuredEasterEggLotteryResult.length > 0
    ? configuredEasterEggLotteryResult
    : null;

export const easterEggLotteryAward =
  configuredEasterEggLotteryAward.length > 0
    ? configuredEasterEggLotteryAward
    : null;
