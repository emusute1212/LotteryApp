import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { STORAGE_KEY, useLotteryStore } from "./store/useLotteryStore";

const persistedState = {
  stage: "reveal",
  config: {
    participantCount: 30,
    prizeTiers: [
      { id: "first", name: "1等", winnerCount: 1, order: 0 },
      { id: "second", name: "2等", winnerCount: 2, order: 1 },
    ],
  },
  session: {
    status: "revealing",
    startedAt: "2026-04-27T12:00:00.000Z",
    currentPrizeIndex: 1,
    revealedWinnerCount: 1,
    results: [
      { prizeTierId: "first", winnerNumbers: [7] },
      { prizeTierId: "second", winnerNumbers: [10, 22] },
    ],
  },
};

describe("App persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    useLotteryStore.setState({
      stage: "setup",
      config: null,
      session: null,
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    useLotteryStore.setState({
      stage: "setup",
      config: null,
      session: null,
    });
  });

  it("restores config and draw session after reload", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: persistedState,
        version: 1,
      }),
    );

    await useLotteryStore.persist.rehydrate();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "2等" })).toBeInTheDocument();
    });

    expect(screen.getByText("10番")).toBeInTheDocument();
    expect(screen.getByText("2名当選")).toBeInTheDocument();
  });
});
