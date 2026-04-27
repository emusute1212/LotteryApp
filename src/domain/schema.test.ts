import { describe, expect, it } from "vitest";
import { lotteryConfigInputSchema } from "./schema";

describe("lotteryConfigInputSchema", () => {
  it("rejects participantCount below 1", () => {
    const result = lotteryConfigInputSchema.safeParse({
      participantCount: 0,
      prizeTiers: [{ id: "tier-1", name: "1等", winnerCount: 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects prize totals greater than participantCount", () => {
    const result = lotteryConfigInputSchema.safeParse({
      participantCount: 2,
      prizeTiers: [
        { id: "tier-1", name: "1等", winnerCount: 1 },
        { id: "tier-2", name: "2等", winnerCount: 2 },
      ],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("当選人数の合計");
    }
  });
});

