import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import type { LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type SetupScreenProps = {
  initialConfig: LotteryConfig | null;
  onSave: (config: LotteryConfig) => void;
};

const setupFormSchema = z
  .object({
    participantCount: z.coerce
      .number()
      .int("参加人数は整数で入力してください")
      .min(1, "参加人数は1名以上で設定してください"),
    prizeTiers: z
      .array(
        z.object({
          id: z.string().min(1),
          winnerCount: z.coerce
            .number()
            .int("当選人数は整数で入力してください")
            .min(1, "当選人数は1名以上で設定してください"),
        }),
      )
      .min(1, "少なくとも1つの等級を設定してください"),
  })
  .superRefine((value, ctx) => {
    const totalWinnerCount = value.prizeTiers.reduce(
      (sum, tier) => sum + tier.winnerCount,
      0,
    );

    if (totalWinnerCount > value.participantCount) {
      ctx.addIssue({
        code: "custom",
        path: ["prizeTiers"],
        message: "当選人数の合計は参加人数以下にしてください",
      });
    }
  });

type SetupFormValues = z.input<typeof setupFormSchema>;
type SetupFormOutput = z.output<typeof setupFormSchema>;

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tier-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createTierDraft = (): NonNullable<SetupFormValues["prizeTiers"]>[number] => ({
  id: generateId(),
  winnerCount: 1,
});

const toDefaultValues = (config: LotteryConfig | null): SetupFormValues => {
  if (!config) {
      return {
        participantCount: 120,
      prizeTiers: [createTierDraft(), createTierDraft()],
    };
  }

  return {
      participantCount: config.participantCount,
      prizeTiers: [...config.prizeTiers]
        .sort((left, right) => left.order - right.order)
        .map((tier) => ({
          id: tier.id,
          winnerCount: tier.winnerCount,
        })),
  };
};

export function SetupScreen({ initialConfig, onSave }: SetupScreenProps) {
  const form = useForm<SetupFormValues, unknown, SetupFormOutput>({
    defaultValues: toDefaultValues(initialConfig),
    resolver: zodResolver(setupFormSchema),
  });
  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    keyName: "fieldKey",
    name: "prizeTiers",
  });

  const totalWinners = (form.watch("prizeTiers") ?? []).reduce<number>(
    (sum, tier) => sum + Number(tier.winnerCount ?? 0),
    0,
  );

  const submit = (values: SetupFormOutput) => {
    onSave({
      participantCount: values.participantCount,
      prizeTiers: values.prizeTiers.map((tier, index) => ({
        id: tier.id,
        name: `${index + 1}等`,
        winnerCount: tier.winnerCount,
        order: index,
      })),
    });
  };

  const addPrizeTier = () => {
    append(createTierDraft());
  };

  return (
    <section className={styles.setupScreen}>
      <div className={styles.setupTitleArea}>
        <div className={styles.setupTitleCard}>
          <img
            alt="まかせてチョイス"
            className={styles.setupTitleImage}
            src="/makasete_choice.png"
          />
        </div>
      </div>

      <form className={styles.setupBoard} onSubmit={form.handleSubmit(submit)}>
        <div className={styles.setupParticipantRow}>
          <label className={styles.setupMainLabel} htmlFor="participantCount">
            抽選人数：
          </label>
          <input
            id="participantCount"
            aria-label="参加者数"
            className={`${styles.input} ${styles.setupCountInput}`}
            type="number"
            inputMode="numeric"
            min={1}
            {...form.register("participantCount")}
          />
        </div>
        {form.formState.errors.participantCount ? (
          <p className={`${styles.errorText} ${styles.setupErrorCenter}`}>
            {form.formState.errors.participantCount.message}
          </p>
        ) : null}

        <div className={styles.setupDivider} />

        <div className={styles.setupTierList}>
          {fields.map((field, index) => {
            const winnerError = form.formState.errors.prizeTiers?.[index]?.winnerCount;

            return (
              <article className={styles.setupTierRow} key={field.fieldKey}>
                <div className={styles.setupTierLabelBlock}>
                  <span className={styles.setupTierStaticLabel}>{index + 1}等：</span>
                </div>

                <input type="hidden" {...form.register(`prizeTiers.${index}.id`)} />

                <div className={styles.setupTierCountBlock}>
                  <input
                    aria-label="当選人数"
                    className={`${styles.input} ${styles.setupTierCountInput}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    {...form.register(`prizeTiers.${index}.winnerCount`)}
                  />
                </div>

                <div className={styles.setupTierTools}>
                  <div className={styles.setupTierActionGroup}>
                    <button
                      aria-label={`${index + 1}等を削除`}
                      className={styles.setupDeleteButton}
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className={styles.setupTierErrorBlock}>
                  {winnerError ? (
                    <p className={styles.errorText}>{winnerError.message}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {form.formState.errors.prizeTiers?.message ? (
          <p className={`${styles.errorText} ${styles.setupErrorCenter}`}>
            {form.formState.errors.prizeTiers.message}
          </p>
        ) : null}

        <div className={styles.setupAddArea}>
          <button
            aria-label="等級を追加"
            className={styles.setupAddButton}
            type="button"
            onClick={addPrizeTier}
          >
            ＋
          </button>
        </div>

        <div className={styles.setupFooterSimple}>
          <div className={styles.setupStats}>
            <div className={styles.setupStatPill}>
              <span>当選人数合計</span>
              <strong>{totalWinners}名</strong>
            </div>
          </div>

          <button className={`${styles.primaryButton} ${styles.setupSubmitButton}`} type="submit">
            抽選スタート
          </button>
        </div>
      </form>
    </section>
  );
}
