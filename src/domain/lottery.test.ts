import { describe, expect, it } from "vitest";
import { createDrawSession } from "./lottery";
import type { LotteryConfig } from "./types";

const sampleConfig: LotteryConfig = {
  participantCount: 20,
  prizeTiers: [
    { id: "grand", name: "1等", winnerCount: 1, order: 0 },
    { id: "second", name: "2等", winnerCount: 2, order: 1 },
    { id: "third", name: "3等", winnerCount: 3, order: 2 },
  ],
};

describe("createDrawSession", () => {
  it("does not create duplicate winner numbers across prizes", () => {
    const session = createDrawSession(sampleConfig, () => 0.42);
    const winnerNumbers = session.results.flatMap((result) => result.winnerNumbers);
    const uniqueNumbers = new Set(winnerNumbers);

    expect(winnerNumbers).toHaveLength(6);
    expect(uniqueNumbers.size).toBe(winnerNumbers.length);
  });

  it("creates results for every prize tier in order", () => {
    const session = createDrawSession(sampleConfig, () => 0.13);

    expect(session.results.map((result) => result.prizeTierId)).toEqual([
      "grand",
      "second",
      "third",
    ]);
  });
});

