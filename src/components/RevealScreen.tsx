import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { easterEggVideoUrl } from "../config/media";
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
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasEasterEggVideo = Boolean(easterEggVideoUrl);
  const tiers = useMemo(() => getSortedPrizeTiers(config), [config]);
  const currentTier = tiers[session.currentPrizeIndex];
  const currentResult = session.results[session.currentPrizeIndex];
  const revealedNumbers = currentResult.winnerNumbers.slice(
    0,
    session.revealedWinnerCount,
  );
  const activeWinnerNumber = revealedNumbers.at(-1) ?? null;
  const previousWinnerNumbers = revealedNumbers.slice(0, -1);
  const isAnimationComplete =
    session.revealedWinnerCount >= currentResult.winnerNumbers.length;

  const closeEasterEgg = () => {
    const videoElement = videoRef.current;

    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }

    setIsEasterEggOpen(false);
  };

  useEffect(() => {
    if (!isEasterEggOpen) {
      return;
    }

    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.currentTime = 0;
    void videoElement.play().catch(() => {
      // Browsers may still require manual playback in some environments.
    });
  }, [isEasterEggOpen]);

  useEffect(() => {
    if (!isEasterEggOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      closeEasterEgg();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isEasterEggOpen]);

  useEffect(() => {
    if (!isEasterEggOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEasterEggOpen]);

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

  const openEasterEgg: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasEasterEggVideo) {
      return;
    }

    setIsEasterEggOpen(true);
  };

  const handleCloseOverlay: React.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeEasterEgg();
  };

  const easterEggOverlay = isEasterEggOpen && hasEasterEggVideo ? (
    <div
      className={styles.easterEggOverlay}
      onClick={handleCloseOverlay}
      role="presentation"
    >
      <div
        className={styles.easterEggDialog}
        onClick={(event) => {
          event.stopPropagation();
        }}
        role="dialog"
        aria-label="イースターエッグ動画"
      >
        <button
          aria-label="動画を閉じる"
          className={styles.easterEggClose}
          onClick={handleCloseOverlay}
          type="button"
        >
          ×
        </button>

        <video
          className={styles.easterEggVideo}
          controls
          onEnded={closeEasterEgg}
          playsInline
          ref={videoRef}
          src={easterEggVideoUrl ?? undefined}
        />
      </div>
    </div>
  ) : null;

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
          {hasEasterEggVideo ? (
            <button
              aria-label="隠し動画を開く"
              className={styles.easterEggTrigger}
              data-testid="easter-egg-trigger"
              onClick={openEasterEgg}
              type="button"
            />
          ) : null}

          <div className={styles.revealCore}>
            <h2 className={styles.revealMainTier}>{currentTier.name}</h2>
            <div className={styles.revealHeroStage}>
              <AnimatePresence initial={false} mode="wait">
                {activeWinnerNumber ? (
                  <motion.div
                    className={styles.revealHeroNumberWrap}
                    key={`${currentTier.id}-${activeWinnerNumber}`}
                    initial={{ opacity: 0, y: 28, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 1.02 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    <strong
                      className={styles.currentWinnerValue}
                      data-testid="winner-number"
                    >
                      {formatLotteryNumber(activeWinnerNumber, config.participantCount)}番
                    </strong>
                  </motion.div>
                ) : (
                  <motion.p
                    className={styles.revealTapHint}
                    key={`${currentTier.id}-pending`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    クリックで発表
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {previousWinnerNumbers.length > 0 ? (
              <div className={styles.revealHistoryStrip}>
                {previousWinnerNumbers.map((winnerNumber) => (
                  <span
                    className={styles.revealHistoryChip}
                    data-testid="winner-number"
                    key={`${currentTier.id}-history-${winnerNumber}`}
                  >
                    {formatLotteryNumber(winnerNumber, config.participantCount)}番
                  </span>
                ))}
              </div>
            ) : (
              <div className={styles.revealHistorySpacer} />
            )}

            {currentResult.winnerNumbers.length > 1 ? (
              <p className={styles.revealSubCount}>
                {currentResult.winnerNumbers.length}名当選
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {easterEggOverlay ? createPortal(easterEggOverlay, document.body) : null}
    </section>
  );
}
