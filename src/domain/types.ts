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
  status: "revealing" | "complete";
  startedAt: string;
  currentPrizeIndex: number;
  results: PrizeResult[];
};

export type AppStage = "setup" | "confirm" | "reveal" | "complete";

