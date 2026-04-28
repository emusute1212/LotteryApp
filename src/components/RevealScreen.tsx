import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatLotteryNumber, getSortedPrizeTiers } from "../domain/lottery";
import type { DrawSession, LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type RevealScreenProps = {
  config: LotteryConfig;
  session: DrawSession;
  onRevealNext: () => void;
  onNextPrize: () => void;
};

export function RevealScreen({
  config,
  session,
  onRevealNext,
  onNextPrize,
}: RevealScreenProps) {
  const tiers = useMemo(() => getSortedPrizeTiers(config), [config]);
  const currentTier = tiers[session.currentPrizeIndex];
  const currentResult = session.results[session.currentPrizeIndex];
  const revealedNumbers = currentResult.winnerNumbers.slice(
    0,
    session.revealedWinnerCount,
  );
  const isAnimationComplete =
    session.revealedWinnerCount >= currentResult.winnerNumbers.length;

  const handleProgress = () => {
    if (isAnimationComplete) {
      onNextPrize();
      return;
    }

    onRevealNext();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleProgress();
  };

  return (
    <section className={styles.stageScreen}>
      <section
        aria-label={`${currentTier.name}の結果発表`}
        className={`${styles.panel} ${styles.revealMinimalPanel}`}
      >
        <div
          className={`${styles.revealSurface} ${styles.revealSurfaceMinimal}`}
          data-testid="reveal-surface"
          onClick={handleProgress}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          <div className={styles.revealCore}>
            <h2 className={styles.revealMainTier}>{currentTier.name}</h2>
            <AnimatePresence initial={false}>
              {revealedNumbers.map((winnerNumber) => (
                <motion.li
                  className={styles.winnerLineMinimal}
                  data-testid="winner-number"
                  key={`${currentTier.id}-${winnerNumber}`}
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <strong className={styles.winnerValueMinimal}>
                    {formatLotteryNumber(winnerNumber, config.participantCount)}番
                  </strong>
                </motion.li>
              ))}
            </AnimatePresence>

            {currentResult.winnerNumbers.length > 1 ? (
              <p className={styles.revealSubCount}>
                {currentResult.winnerNumbers.length}名当選
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
