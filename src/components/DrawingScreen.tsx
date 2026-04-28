import { useEffect } from "react";
import styles from "../App.module.css";

type DrawingScreenProps = {
  onReveal: () => void;
};

export function DrawingScreen({ onReveal }: DrawingScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onReveal();
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onReveal]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onReveal();
  };

  return (
    <section className={styles.stageScreen}>
      <section
        className={`${styles.panel} ${styles.drawingOnlyPanel}`}
        onClick={onReveal}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <h2 className={styles.drawingOnlyTitle}>抽選中・・・</h2>
      </section>
    </section>
  );
}
