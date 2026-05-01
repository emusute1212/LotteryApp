import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createDrawSession,
  getSortedPrizeTiers,
  sortPrizeResultsByRevealOrder,
} from "../domain/lottery";
import type {
  AppStage,
  DrawSession,
  LotteryConfig,
  PrizeResult,
} from "../domain/types";

type LotteryStore = {
  stage: AppStage;
  config: LotteryConfig | null;
  session: DrawSession | null;
  saveConfig: (config: LotteryConfig) => void;
  editConfig: () => void;
  beginReveal: () => void;
  revealNextWinner: () => void;
  advancePrize: () => void;
  restartWithSameConfig: () => void;
  resetAll: () => void;
};

export const STORAGE_KEY = "lottery-app-storage";

const normalizeConfig = (config: LotteryConfig): LotteryConfig => ({
  ...config,
  prizeTiers: getSortedPrizeTiers(config).map((tier, index) => ({
    ...tier,
    order: index,
  })),
});

const initialState = {
  stage: "setup" as AppStage,
  config: null,
  session: null,
};

const FALLBACK_STARTED_AT = new Date(0).toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAppStage = (value: unknown): value is AppStage =>
  value === "setup" ||
  value === "drawing" ||
  value === "reveal" ||
  value === "complete";

const sanitizeWinnerNumbers = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is number =>
          typeof entry === "number" && Number.isInteger(entry) && entry > 0,
      )
    : [];

const sanitizeConfig = (value: unknown): LotteryConfig | null => {
  if (
    !isRecord(value) ||
    typeof value.participantCount !== "number" ||
    !Number.isInteger(value.participantCount) ||
    value.participantCount < 1 ||
    !Array.isArray(value.prizeTiers)
  ) {
    return null;
  }

  const prizeTiers = value.prizeTiers.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.name !== "string" ||
      typeof entry.winnerCount !== "number" ||
      !Number.isInteger(entry.winnerCount) ||
      entry.winnerCount < 1 ||
      typeof entry.order !== "number" ||
      !Number.isInteger(entry.order)
    ) {
      return [];
    }

    return [
      {
        id: entry.id,
        name: entry.name,
        winnerCount: entry.winnerCount,
        order: entry.order,
      },
    ];
  });

  if (prizeTiers.length === 0) {
    return null;
  }

  return normalizeConfig({
    participantCount: value.participantCount,
    prizeTiers,
  });
};

const sanitizeResults = (value: unknown): PrizeResult[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.prizeTierId !== "string") {
          return [];
        }

        return [
          {
            prizeTierId: entry.prizeTierId,
            winnerNumbers: sanitizeWinnerNumbers(entry.winnerNumbers),
          },
        ];
      })
    : [];

const sanitizeSession = (
  value: unknown,
  stage: AppStage,
): DrawSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const results = sanitizeResults(value.results);

  if (results.length === 0) {
    return null;
  }

  const maxIndex = results.length - 1;
  const rawCurrentPrizeIndex =
    typeof value.currentPrizeIndex === "number" &&
    Number.isInteger(value.currentPrizeIndex)
      ? value.currentPrizeIndex
      : 0;
  const currentPrizeIndex = Math.min(Math.max(0, rawCurrentPrizeIndex), maxIndex);
  const maxRevealCount = results[currentPrizeIndex]?.winnerNumbers.length ?? 0;
  const rawRevealedWinnerCount =
    typeof value.revealedWinnerCount === "number" &&
    Number.isInteger(value.revealedWinnerCount)
      ? value.revealedWinnerCount
      : 0;
  const revealedWinnerCount = Math.min(
    Math.max(0, rawRevealedWinnerCount),
    maxRevealCount,
  );

  return {
    startedAt:
      typeof value.startedAt === "string"
        ? value.startedAt
        : FALLBACK_STARTED_AT,
    currentPrizeIndex,
    revealedWinnerCount,
    results,
    status:
      stage === "drawing"
        ? "drawing"
        : stage === "complete" || value.status === "complete"
          ? "complete"
          : "revealing",
  };
};

const normalizeSessionForRevealOrder = (
  config: LotteryConfig | null,
  session: DrawSession | null,
  persistedVersion: number,
): DrawSession | null => {
  if (!config || !session) {
    return session;
  }

  const results = sortPrizeResultsByRevealOrder(config, session.results);

  if (results.length === 0) {
    return null;
  }

  const maxIndex = results.length - 1;
  const currentPrizeIndex =
    persistedVersion < 4
      ? Math.min(Math.max(0, maxIndex - session.currentPrizeIndex), maxIndex)
      : Math.min(Math.max(0, session.currentPrizeIndex), maxIndex);
  const maxRevealCount = results[currentPrizeIndex]?.winnerNumbers.length ?? 0;

  return {
    ...session,
    currentPrizeIndex,
    revealedWinnerCount: Math.min(session.revealedWinnerCount, maxRevealCount),
    results,
  };
};

export const useLotteryStore = create<LotteryStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      saveConfig: (config) => {
        const normalizedConfig = normalizeConfig(config);

        set({
          config: normalizedConfig,
          session: createDrawSession(normalizedConfig),
          stage: "drawing",
        });
      },
      editConfig: () =>
        set((state) => ({
          config: state.config,
          session: null,
          stage: "setup",
        })),
      beginReveal: () =>
        set((state) => {
          if (!state.session) {
            return state;
          }

          return {
            stage: "reveal" as AppStage,
            session: {
              ...state.session,
              status: "revealing" as const,
            },
          };
        }),
      revealNextWinner: () =>
        set((state) => {
          if (!state.session) {
            return state;
          }

          const currentResult = state.session.results[state.session.currentPrizeIndex];
          const nextCount = Math.min(
            state.session.revealedWinnerCount + 1,
            currentResult?.winnerNumbers.length ?? 0,
          );

          return {
            session: {
              ...state.session,
              status: "revealing" as const,
              revealedWinnerCount: nextCount,
            },
          };
        }),
      advancePrize: () =>
        set((state) => {
          if (!state.session) {
            return state;
          }

          const lastIndex = state.session.results.length - 1;

          if (state.session.currentPrizeIndex >= lastIndex) {
            return {
              stage: "complete" as AppStage,
              session: {
                ...state.session,
                status: "complete" as const,
              },
            };
          }

          return {
            stage: "reveal" as AppStage,
            session: {
              ...state.session,
              status: "revealing" as const,
              currentPrizeIndex: state.session.currentPrizeIndex + 1,
              revealedWinnerCount: 0,
            },
          };
        }),
      restartWithSameConfig: () => {
        const { config } = get();

        if (!config) {
          set(initialState);
          return;
        }

        set({
          config,
          session: createDrawSession(config),
          stage: "drawing",
        });
      },
      resetAll: () => set(initialState),
    }),
    {
      name: STORAGE_KEY,
      version: 4,
      migrate: (persistedState, version) => {
        const state = (persistedState ?? {}) as Partial<LotteryStore> & {
          config?: unknown;
          stage?: string;
          session?: unknown;
        };
        const persistedStage = String(state?.stage ?? "");
        const normalizedStage =
          persistedStage === "confirm"
            ? "setup"
            : isAppStage(persistedStage)
              ? persistedStage
              : "setup";
        const normalizedConfig = sanitizeConfig(state?.config);
        const normalizedSession =
          normalizedStage === "setup"
            ? null
            : normalizeSessionForRevealOrder(
                normalizedConfig,
                sanitizeSession(state?.session, normalizedStage),
                version,
              );

        return {
          ...state,
          config: normalizedConfig,
          stage: normalizedSession ? normalizedStage : "setup",
          session: normalizedSession,
        };
      },
    },
  ),
);
