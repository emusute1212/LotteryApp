import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  easterEggLotteryAward,
  easterEggLotteryResult,
  easterEggVideoUrl,
} from "../config/media";
import { formatLotteryNumber, getRevealPrizeTiers } from "../domain/lottery";
import type { DrawSession, LotteryConfig } from "../domain/types";
import styles from "../App.module.css";

type RevealScreenProps = {
  config: LotteryConfig;
  session: DrawSession;
  onRevealNext: () => void;
  onNextPrize: () => void;
};

type EasterEggPhase = "closed" | "video" | "result";

const EASTER_EGG_WINNER_MIN_FONT_SIZE = 44;
const EASTER_EGG_WINNER_MAX_FONT_SIZE = 160;
const EASTER_EGG_WINNER_SAFE_GUTTER = 24;
const EASTER_EGG_WINNER_SAFE_HEIGHT = 16;

export function RevealScreen({
  config,
  session,
  onRevealNext,
  onNextPrize,
}: RevealScreenProps) {
  const [easterEggPhase, setEasterEggPhase] = useState<EasterEggPhase>("closed");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const easterEggWinnerStageRef = useRef<HTMLDivElement | null>(null);
  const easterEggWinnerWrapRef = useRef<HTMLDivElement | null>(null);
  const easterEggWinnerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const hasEasterEggVideo = Boolean(easterEggVideoUrl);
  const hasEasterEggResult = Boolean(
    easterEggLotteryAward && easterEggLotteryResult,
  );
  const isEasterEggOpen = easterEggPhase !== "closed";
  const tiers = useMemo(() => getRevealPrizeTiers(config), [config]);
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
      try {
        videoElement.pause();
      } catch {
        // Ignore media teardown failures in restricted environments.
      }
      videoElement.currentTime = 0;
    }

    setEasterEggPhase("closed");
  };

  useEffect(() => {
    if (easterEggPhase !== "video") {
      return;
    }

    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.currentTime = 0;

    try {
      const playback = videoElement.play();
      void playback?.catch(() => {
        // Browsers may still require manual playback in some environments.
      });
    } catch {
      // Some test or embedded environments may block programmatic playback.
    }
  }, [easterEggPhase]);

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

  useLayoutEffect(() => {
    if (easterEggPhase !== "result") {
      return;
    }

    const wrapElement = easterEggWinnerWrapRef.current;
    const textElement = easterEggWinnerRef.current;
    const stageElement = easterEggWinnerStageRef.current;

    if (!wrapElement || !textElement || !stageElement) {
      return;
    }

    let frameId = 0;

    const fitWinnerText = () => {
      const wrapStyle = window.getComputedStyle(wrapElement);
      const paddingInline =
        Number.parseFloat(wrapStyle.paddingLeft) +
        Number.parseFloat(wrapStyle.paddingRight);
      const availableWidth = Math.max(
        wrapElement.clientWidth - paddingInline - EASTER_EGG_WINNER_SAFE_GUTTER,
        EASTER_EGG_WINNER_MIN_FONT_SIZE,
      );
      const availableHeight = Math.max(
        stageElement.clientHeight - EASTER_EGG_WINNER_SAFE_HEIGHT,
        EASTER_EGG_WINNER_MIN_FONT_SIZE,
      );

      if (availableWidth <= 0 || availableHeight <= 0) {
        return;
      }

      let low = EASTER_EGG_WINNER_MIN_FONT_SIZE;
      let high = EASTER_EGG_WINNER_MAX_FONT_SIZE;
      let best = EASTER_EGG_WINNER_MIN_FONT_SIZE;

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        textElement.style.fontSize = `${middle}px`;

        const textRect = textElement.getBoundingClientRect();

        if (
          textElement.scrollWidth <= availableWidth &&
          textRect.height <= availableHeight
        ) {
          best = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      textElement.style.fontSize = `${best}px`;
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(fitWinnerText);
    };

    scheduleFit();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleFit();
          })
        : null;

    resizeObserver?.observe(wrapElement);
    window.addEventListener("resize", scheduleFit);
    void document.fonts?.ready.then(() => {
      scheduleFit();
    });

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleFit);
    };
  }, [easterEggPhase, easterEggLotteryResult]);

  const handleProgress = () => {
    if (isAnimationComplete) {
      onNextPrize();
      return;
    }

    onRevealNext();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }

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

    setEasterEggPhase("video");
  };

  const handleCloseOverlay: React.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeEasterEgg();
  };

  const handleVideoEnded = () => {
    if (hasEasterEggResult) {
      setEasterEggPhase("result");
      return;
    }

    closeEasterEgg();
  };

  const easterEggOverlay =
    easterEggPhase === "video" && hasEasterEggVideo ? (
      <div
        className={`${styles.easterEggOverlay} ${styles.easterEggVideoOverlay}`}
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
            data-testid="easter-egg-video"
            onEnded={handleVideoEnded}
            playsInline
            ref={videoRef}
            src={easterEggVideoUrl ?? undefined}
          />
        </div>
      </div>
    ) : easterEggPhase === "result" &&
        easterEggLotteryAward &&
        easterEggLotteryResult ? (
      <motion.div
        className={`${styles.easterEggOverlay} ${styles.easterEggResultOverlay}`}
        data-testid="easter-egg-result-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={handleCloseOverlay}
        role="presentation"
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: "easeOut" }}
      >
        <motion.section
          aria-label="イースターエッグ結果"
          className={`${styles.panel} ${styles.revealMinimalPanel} ${styles.easterEggResultPanel}`}
          data-testid="easter-egg-result"
          initial={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 0, y: 22, scale: 0.985 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          role="dialog"
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }
          }
        >
          <div
            className={`${styles.revealSurface} ${styles.revealSurfaceMinimal} ${styles.easterEggResultSurface}`}
          >
            <motion.div
              className={`${styles.revealCore} ${styles.easterEggResultCore}`}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: prefersReducedMotion
                    ? { staggerChildren: 0 }
                    : { staggerChildren: 0.11, delayChildren: 0.1 },
                },
              }}
            >
              <motion.h2
                className={`${styles.revealMainTier} ${styles.easterEggResultAward}`}
                variants={{
                  hidden: prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: -18, filter: "blur(6px)" },
                  visible: prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.34, ease: "easeOut" }
                }
              >
                {easterEggLotteryAward}
              </motion.h2>
              <div
                className={styles.revealHeroStage}
                ref={easterEggWinnerStageRef}
              >
                <div
                  className={`${styles.revealHeroNumberWrap} ${styles.easterEggResultWinnerWrap}`}
                  ref={easterEggWinnerWrapRef}
                >
                  <motion.strong
                    className={`${styles.currentWinnerValue} ${styles.easterEggResultWinner}`}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 28, scale: 0.92, filter: "blur(10px)" }
                    }
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
                    }
                    ref={easterEggWinnerRef}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.48, ease: [0.16, 1, 0.3, 1], delay: 0.14 }
                    }
                  >
                    {easterEggLotteryResult}
                  </motion.strong>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
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
