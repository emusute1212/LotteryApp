import type { DrawSession, LotteryConfig, PrizeResult, PrizeTier } from "./types";

export const getSortedPrizeTiers = (config: LotteryConfig): PrizeTier[] =>
  [...config.prizeTiers].sort((left, right) => left.order - right.order);

export const getTotalWinnerCount = (config: LotteryConfig): number =>
  config.prizeTiers.reduce((sum, tier) => sum + tier.winnerCount, 0);

export const formatLotteryNumber = (
  value: number,
  participantCount: number,
): string => {
  const digits = Math.max(2, String(participantCount).length);
  return String(value).padStart(digits, "0");
};

const createNumberPool = (
  participantCount: number,
  rng: () => number,
): number[] => {
  const numbers = Array.from({ length: participantCount }, (_, index) => index + 1);

  for (let current = numbers.length - 1; current > 0; current -= 1) {
    const swapIndex = Math.floor(rng() * (current + 1));
    [numbers[current], numbers[swapIndex]] = [
      numbers[swapIndex],
      numbers[current],
    ];
  }

  return numbers;
};

export const createDrawSession = (
  config: LotteryConfig,
  rng: () => number = Math.random,
): DrawSession => {
  const sortedTiers = getSortedPrizeTiers(config);
  const pool = createNumberPool(config.participantCount, rng);
  let cursor = 0;

  const results: PrizeResult[] = sortedTiers.map((tier) => {
    const winnerNumbers = pool.slice(cursor, cursor + tier.winnerCount);
    cursor += tier.winnerCount;

    return {
      prizeTierId: tier.id,
      winnerNumbers,
    };
  });

  return {
    status: "drawing",
    startedAt: new Date().toISOString(),
    currentPrizeIndex: 0,
    revealedWinnerCount: 0,
    results,
  };
};

export const getTierResult = (
  session: DrawSession,
  prizeTierId: string,
): PrizeResult | undefined =>
  session.results.find((result) => result.prizeTierId === prizeTierId);
