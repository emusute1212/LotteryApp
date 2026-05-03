import {
  formatLotteryNumber,
  getRevealPrizeTiers,
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
  const tiers = getRevealPrizeTiers(config);

  return (
    <section className={styles.stageScreen}>
      <div className={`${styles.panel} ${styles.stagePanel} ${styles.stagePanelComplete}`}>
        <div className={styles.stageHeader}>
          <div>
            <p className={styles.stageEyebrow}>Complete</p>
            <h2 className={styles.stageTitle}>抽選完了</h2>
          </div>
        </div>

        <div className={styles.completeListViewport}>
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
        </div>

        <div className={styles.stageActionRow}>
          <button className={styles.ghostButton} type="button" onClick={onReset}>
            最初から設定し直す
          </button>
          <button className={styles.primaryButton} type="button" onClick={onRestart}>
            同じ設定でもう一度抽選
          </button>
        </div>
      </div>
    </section>
  );
}
