export type PrizeTier = {
  id: string;
  name: string;
  winnerCount: number;
  order: number;
};

export type LotteryConfig = {
  participantCount: number;
  prizeTiers: PrizeTier[];
};

export type PrizeResult = {
  prizeTierId: string;
  winnerNumbers: number[];
};

export type DrawSession = {
  status: "drawing" | "revealing" | "complete";
  startedAt: string;
  currentPrizeIndex: number;
  revealedWinnerCount: number;
  results: PrizeResult[];
};

export type AppStage = "setup" | "drawing" | "reveal" | "complete";
