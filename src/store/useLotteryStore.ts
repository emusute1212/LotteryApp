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
  startDraw: () => void;
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
      saveConfig: (config) =>
        set({
          config: normalizeConfig(config),
          session: null,
          stage: "confirm",
        }),
      editConfig: () =>
        set((state) => ({
          config: state.config,
          session: null,
          stage: "setup",
        })),
      startDraw: () => {
        const { config } = get();

        if (!config) {
          return;
        }

        set({
          session: createDrawSession(config),
          stage: "reveal",
        });
      },
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
              currentPrizeIndex: state.session.currentPrizeIndex + 1,
            },
          };
        }),
      restartWithSameConfig: () =>
        set((state) => ({
          config: state.config,
          session: null,
          stage: state.config ? "confirm" : "setup",
        })),
      resetAll: () => set(initialState),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    },
  ),
);

