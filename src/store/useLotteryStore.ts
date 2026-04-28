import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createDrawSession,
  getSortedPrizeTiers,
} from "../domain/lottery";
import type { AppStage, DrawSession, LotteryConfig } from "../domain/types";

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
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<LotteryStore> & {
          stage?: string;
          session?: Partial<DrawSession> | null;
        };
        const hasSession = Boolean(state?.session);
        const persistedStage = String(state?.stage ?? "");

        return {
          ...state,
          stage:
            persistedStage === "confirm"
              ? "setup"
              : hasSession
                ? ((persistedStage ?? "setup") as AppStage)
                : "setup",
          session: state?.session
            ? {
                ...state.session,
                status:
                  state.session.status === "complete"
                    ? "complete"
                    : state.stage === "drawing"
                      ? "drawing"
                      : "revealing",
                revealedWinnerCount:
                  typeof state.session.revealedWinnerCount === "number"
                    ? state.session.revealedWinnerCount
                    : 0,
              }
            : null,
        };
      },
    },
  ),
);
