import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  lotteryConfigInputSchema,
  toLotteryConfig,
} from "../domain/schema";
import type { LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type SetupScreenProps = {
  initialConfig: LotteryConfig | null;
  onSave: (config: LotteryConfig) => void;
};

type SetupFormValues = z.input<typeof lotteryConfigInputSchema>;
type SetupFormOutput = z.output<typeof lotteryConfigInputSchema>;

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tier-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createTierDraft = (index: number): NonNullable<SetupFormValues["prizeTiers"]>[number] => ({
  id: generateId(),
  name: `${index + 1}等`,
  winnerCount: 1,
});

const toDefaultValues = (config: LotteryConfig | null): SetupFormValues => {
  if (!config) {
    return {
      participantCount: 120,
      prizeTiers: [createTierDraft(0), createTierDraft(1)],
    };
  }

  return {
    participantCount: config.participantCount,
    prizeTiers: [...config.prizeTiers]
      .sort((left, right) => left.order - right.order)
      .map((tier) => ({
        id: tier.id,
        name: tier.name,
        winnerCount: tier.winnerCount,
      })),
  };
};

export function SetupScreen({ initialConfig, onSave }: SetupScreenProps) {
  const form = useForm<SetupFormValues, unknown, SetupFormOutput>({
    defaultValues: toDefaultValues(initialConfig),
    resolver: zodResolver(lotteryConfigInputSchema),
  });
  const {
    fields,
    append,
    move,
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
    onSave(toLotteryConfig(values));
  };

  const addPrizeTier = () => {
    append(createTierDraft(fields.length));
  };

  const moveTier = (index: number, direction: -1 | 1) => {
    const target = index + direction;

    if (target < 0 || target >= fields.length) {
      return;
    }

    move(index, target);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Step 1</p>
          <h2 className={styles.sectionTitle}>抽選設定</h2>
        </div>
        <p className={styles.sectionLead}>
          参加者数と等級を決めると、抽選開始時に全当選番号が一括で確定します。
        </p>
      </div>

      <form className={styles.form} onSubmit={form.handleSubmit(submit)}>
        <div className={styles.fieldBlock}>
          <label className={styles.fieldLabel} htmlFor="participantCount">
            参加者数
          </label>
          <input
            id="participantCount"
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={1}
            {...form.register("participantCount")}
          />
          <p className={styles.fieldHint}>番号は `1` から `参加者数` までで抽選します。</p>
          {form.formState.errors.participantCount ? (
            <p className={styles.errorText}>
              {form.formState.errors.participantCount.message}
            </p>
          ) : null}
        </div>

        <div className={styles.inlineStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>設定した等級数</span>
            <strong className={styles.statValue}>{fields.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>当選人数合計</span>
            <strong className={styles.statValue}>{totalWinners}名</strong>
          </div>
        </div>

        <div className={styles.listHeader}>
          <div>
            <p className={styles.eyebrow}>Prize Tiers</p>
            <h3 className={styles.listTitle}>等級設定</h3>
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={addPrizeTier}
          >
            等級を追加
          </button>
        </div>

        <div className={styles.tierList}>
          {fields.map((field, index) => {
            const winnerError = form.formState.errors.prizeTiers?.[index]?.winnerCount;
            const nameError = form.formState.errors.prizeTiers?.[index]?.name;

            return (
              <article className={styles.tierCard} key={field.fieldKey}>
                <div className={styles.tierCardHeader}>
                  <div>
                    <p className={styles.tierIndex}>#{index + 1}</p>
                    <h4 className={styles.tierCardTitle}>{index + 1}番目に発表</h4>
                  </div>
                  <div className={styles.tierActions}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => moveTier(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => moveTier(index, 1)}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className={styles.tierGrid}>
                  <div className={styles.fieldBlock}>
                    <label className={styles.fieldLabel} htmlFor={`tier-name-${field.id}`}>
                      等級名
                    </label>
                    <input
                      id={`tier-name-${field.id}`}
                      className={styles.input}
                      type="text"
                      {...form.register(`prizeTiers.${index}.name`)}
                    />
                    {nameError ? (
                      <p className={styles.errorText}>{nameError.message}</p>
                    ) : null}
                  </div>

                  <div className={styles.fieldBlock}>
                    <label
                      className={styles.fieldLabel}
                      htmlFor={`tier-winner-count-${field.id}`}
                    >
                      当選人数
                    </label>
                    <input
                      id={`tier-winner-count-${field.id}`}
                      className={styles.input}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      {...form.register(`prizeTiers.${index}.winnerCount`)}
                    />
                    {winnerError ? (
                      <p className={styles.errorText}>{winnerError.message}</p>
                    ) : null}
                  </div>
                </div>

                <input type="hidden" {...form.register(`prizeTiers.${index}.id`)} />
              </article>
            );
          })}
        </div>

        {form.formState.errors.prizeTiers?.message ? (
          <p className={styles.errorText}>{form.formState.errors.prizeTiers.message}</p>
        ) : null}

        <div className={styles.actionRow}>
          <button className={styles.primaryButton} type="submit">
            設定を確認する
          </button>
        </div>
      </form>
    </section>
  );
}
