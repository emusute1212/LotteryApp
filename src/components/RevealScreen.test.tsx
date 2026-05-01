import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DrawSession, LotteryConfig } from "../domain/types";
import { RevealScreen } from "./RevealScreen";

vi.mock("../config/media", () => ({
  easterEggVideoUrl: "https://example.com/easter-egg.mp4",
  easterEggLotteryAward: "特賞",
  easterEggLotteryResult: "山田太郎",
}));

const config: LotteryConfig = {
  participantCount: 30,
  prizeTiers: [
    { id: "first", name: "1等", winnerCount: 1, order: 0 },
    { id: "second", name: "2等", winnerCount: 2, order: 1 },
  ],
};

const session: DrawSession = {
  status: "revealing",
  startedAt: "2026-05-02T00:00:00.000Z",
  currentPrizeIndex: 0,
  revealedWinnerCount: 0,
  results: [
    { prizeTierId: "second", winnerNumbers: [10, 22] },
    { prizeTierId: "first", winnerNumbers: [7] },
  ],
};

describe("RevealScreen easter egg", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the configured winner after the video ends and closes on click", async () => {
    const user = userEvent.setup();

    render(
      <RevealScreen
        config={config}
        onNextPrize={vi.fn()}
        onRevealNext={vi.fn()}
        session={session}
      />,
    );

    await user.click(screen.getByTestId("easter-egg-trigger"));

    expect(
      screen.getByRole("dialog", { name: "イースターエッグ動画" }),
    ).toBeInTheDocument();

    fireEvent.ended(screen.getByTestId("easter-egg-video"));

    expect(
      screen.getByRole("dialog", { name: "イースターエッグ結果" }),
    ).toBeInTheDocument();
    expect(screen.getByText("特賞")).toBeInTheDocument();
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.queryByText("Surprise Result")).not.toBeInTheDocument();
    expect(screen.queryByText("当選者")).not.toBeInTheDocument();
    expect(
      screen.queryByText("クリックで元の画面に戻る"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("easter-egg-result-overlay"));

    expect(
      screen.queryByRole("dialog", { name: "イースターエッグ結果" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2等" })).toBeInTheDocument();
  });
});
