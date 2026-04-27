import { z } from "zod";
import type { LotteryConfig } from "./types";

export const prizeTierInputSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "等級名を入力してください")
    .max(40, "等級名は40文字以内で入力してください"),
  winnerCount: z.coerce
    .number()
    .int("当選人数は整数で入力してください")
    .min(1, "当選人数は1名以上で設定してください"),
});

export const lotteryConfigInputSchema = z
  .object({
    participantCount: z.coerce
      .number()
      .int("参加者数は整数で入力してください")
      .min(1, "参加者数は1名以上で設定してください"),
    prizeTiers: z
      .array(prizeTierInputSchema)
      .min(1, "少なくとも1つの等級を設定してください"),
  })
  .superRefine((value, ctx) => {
    const totalWinners = value.prizeTiers.reduce(
      (sum, tier) => sum + tier.winnerCount,
      0,
    );

    if (totalWinners > value.participantCount) {
      ctx.addIssue({
        code: "custom",
        path: ["prizeTiers"],
        message: "当選人数の合計は参加者数以下にしてください",
      });
    }
  });

export type LotteryConfigInput = z.input<typeof lotteryConfigInputSchema>;
export type LotteryConfigValue = z.output<typeof lotteryConfigInputSchema>;

export const toLotteryConfig = (value: LotteryConfigValue): LotteryConfig => ({
  participantCount: value.participantCount,
  prizeTiers: value.prizeTiers.map(
    (tier, index) => ({
      id: tier.id,
      name: tier.name.trim(),
      winnerCount: tier.winnerCount,
      order: index,
    }),
  ),
});
