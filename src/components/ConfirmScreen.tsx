import {
  formatLotteryNumber,
  getSortedPrizeTiers,
  getTotalWinnerCount,
} from "../domain/lottery";
import type { LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type ConfirmScreenProps = {
  config: LotteryConfig;
  onBack: () => void;
  onStart: () => void;
};

export function ConfirmScreen({ config, onBack, onStart }: ConfirmScreenProps) {
  const sortedTiers = getSortedPrizeTiers(config);
  const totalWinners = getTotalWinnerCount(config);

  return (
    <section className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Step 2</p>
          <h2 className={styles.sectionTitle}>設定内容の確認</h2>
        </div>
        <p className={styles.sectionLead}>
          抽選を開始すると、全ての当選番号がこの時点で確定します。
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>参加者数</span>
          <strong className={styles.summaryValue}>{config.participantCount}名</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>当選人数合計</span>
          <strong className={styles.summaryValue}>{totalWinners}名</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>番号表示形式</span>
          <strong className={styles.summaryValue}>
            {formatLotteryNumber(1, config.participantCount)} 形式
          </strong>
        </article>
      </div>

      <div className={styles.confirmList}>
        {sortedTiers.map((tier, index) => (
          <article className={styles.confirmItem} key={tier.id}>
            <div>
              <p className={styles.tierIndex}>第{index + 1}発表</p>
              <h3 className={styles.confirmItemTitle}>{tier.name}</h3>
            </div>
            <strong className={styles.confirmItemCount}>{tier.winnerCount}名</strong>
          </article>
        ))}
      </div>

      <div className={styles.actionRow}>
        <button className={styles.ghostButton} type="button" onClick={onBack}>
          設定を編集
        </button>
        <button className={styles.primaryButton} type="button" onClick={onStart}>
          抽選を開始
        </button>
      </div>
    </section>
  );
}

