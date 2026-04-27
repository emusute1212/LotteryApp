import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatLotteryNumber, getSortedPrizeTiers } from "../domain/lottery";
import type { DrawSession, LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type RevealScreenProps = {
  config: LotteryConfig;
  session: DrawSession;
  onNext: () => void;
};

export function RevealScreen({ config, session, onNext }: RevealScreenProps) {
  const tiers = useMemo(() => getSortedPrizeTiers(config), [config]);
  const currentTier = tiers[session.currentPrizeIndex];
  const currentResult = session.results[session.currentPrizeIndex];
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);

    const timers = currentResult.winnerNumbers.map((_, index) =>
      window.setTimeout(() => {
        setVisibleCount(index + 1);
      }, 900 + index * 700),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [currentResult, currentTier.id]);

  const revealedNumbers = currentResult.winnerNumbers.slice(0, visibleCount);
  const isAnimationComplete = visibleCount >= currentResult.winnerNumbers.length;
  const isLastTier = session.currentPrizeIndex === tiers.length - 1;

  return (
    <section className={`${styles.panel} ${styles.revealPanel}`}>
      <div className={styles.revealHeader}>
        <div>
          <p className={styles.eyebrow}>Step 3</p>
          <h2 className={styles.revealTitle}>{currentTier.name}</h2>
        </div>
        <div className={styles.progressPill}>
          {session.currentPrizeIndex + 1} / {tiers.length}
        </div>
      </div>

      <p className={styles.revealLead}>
        抽選結果を1名ずつ表示します。全員表示されたら次の等級へ進めます。
      </p>

      <div className={styles.heroNumber}>
        <span>参加者番号</span>
        <strong>{formatLotteryNumber(config.participantCount, config.participantCount)}まで</strong>
      </div>

      <div className={styles.winnerStage}>
        <AnimatePresence>
          {revealedNumbers.map((winnerNumber) => (
            <motion.li
              className={styles.winnerLine}
              data-testid="winner-number"
              key={`${currentTier.id}-${winnerNumber}`}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span className={styles.winnerLabel}>{currentTier.name}は</span>
              <strong className={styles.winnerValue}>
                {formatLotteryNumber(winnerNumber, config.participantCount)}番
              </strong>
            </motion.li>
          ))}
        </AnimatePresence>

        {!revealedNumbers.length ? (
          <motion.div
            className={styles.waitingBadge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            抽選中...
          </motion.div>
        ) : null}
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={onNext}
          disabled={!isAnimationComplete}
        >
          {isLastTier ? "結果一覧へ" : "次の等へ"}
        </button>
      </div>
    </section>
  );
}

