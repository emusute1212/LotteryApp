import {
  formatLotteryNumber,
  getSortedPrizeTiers,
  getTierResult,
} from "../domain/lottery";
import type { DrawSession, LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type CompleteScreenProps = {
  config: LotteryConfig;
  session: DrawSession;
  onRestart: () => void;
  onReset: () => void;
};

export function CompleteScreen({
  config,
  session,
  onRestart,
  onReset,
}: CompleteScreenProps) {
  const tiers = getSortedPrizeTiers(config);

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Step 4</p>
          <h2 className={styles.sectionTitle}>抽選完了</h2>
        </div>
        <p className={styles.sectionLead}>
          全ての等級の当選番号が確定しました。同じ設定でもう一度抽選できます。
        </p>
      </div>

      <div className={styles.completeList}>
        {tiers.map((tier) => {
          const result = getTierResult(session, tier.id);

          return (
            <article className={styles.completeCard} key={tier.id}>
              <div className={styles.completeCardHeader}>
                <h3 className={styles.completeCardTitle}>{tier.name}</h3>
                <span className={styles.completeCardMeta}>{tier.winnerCount}名</span>
              </div>

              <div className={styles.numberCloud}>
                {result?.winnerNumbers.map((winnerNumber) => (
                  <span className={styles.numberChip} key={`${tier.id}-${winnerNumber}`}>
                    {formatLotteryNumber(winnerNumber, config.participantCount)}番
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.actionRow}>
        <button className={styles.ghostButton} type="button" onClick={onReset}>
          最初から設定し直す
        </button>
        <button className={styles.primaryButton} type="button" onClick={onRestart}>
          同じ設定でもう一度抽選
        </button>
      </div>
    </section>
  );
}

