import { useMemo } from "react";
import { CompleteScreen } from "./components/CompleteScreen";
import { ConfirmScreen } from "./components/ConfirmScreen";
import { RevealScreen } from "./components/RevealScreen";
import { SetupScreen } from "./components/SetupScreen";
import { getSortedPrizeTiers, getTotalWinnerCount } from "./domain/lottery";
import { useLotteryStore } from "./store/useLotteryStore";
import styles from "./App.module.css";

const stageLabels = [
  { id: "setup", label: "設定" },
  { id: "confirm", label: "確認" },
  { id: "reveal", label: "抽選" },
  { id: "complete", label: "完了" },
] as const;

const getStageIndex = (stage: string): number =>
  stageLabels.findIndex((item) => item.id === stage);

export default function App() {
  const stage = useLotteryStore((state) => state.stage);
  const config = useLotteryStore((state) => state.config);
  const session = useLotteryStore((state) => state.session);
  const saveConfig = useLotteryStore((state) => state.saveConfig);
  const editConfig = useLotteryStore((state) => state.editConfig);
  const startDraw = useLotteryStore((state) => state.startDraw);
  const advancePrize = useLotteryStore((state) => state.advancePrize);
  const restartWithSameConfig = useLotteryStore((state) => state.restartWithSameConfig);
  const resetAll = useLotteryStore((state) => state.resetAll);

  const safeStage = useMemo(() => {
    if (!config) {
      return "setup";
    }

    if (session && stage === "complete") {
      return "complete";
    }

    if (session) {
      return "reveal";
    }

    return stage === "setup" ? "setup" : "confirm";
  }, [config, session, stage]);

  const stageIndex = getStageIndex(safeStage);
  const tiers = config ? getSortedPrizeTiers(config) : [];
  const totalWinners = config ? getTotalWinnerCount(config) : 0;

  return (
    <div className={styles.appShell}>
      <div className={styles.backgroundGlow} />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Lottery Experience</p>
            <h1 className={styles.heroTitle}>同窓会抽選アプリ</h1>
            <p className={styles.heroLead}>
              大画面で見やすく、進行しやすく、再読込にも強い抽選進行用のWebアプリです。
            </p>
          </div>

          <aside className={styles.heroAside}>
            <div className={styles.summaryBadge}>
              <span>参加者</span>
              <strong>{config ? `${config.participantCount}名` : "未設定"}</strong>
            </div>
            <div className={styles.summaryBadge}>
              <span>当選枠</span>
              <strong>{config ? `${totalWinners}名` : "未設定"}</strong>
            </div>
            <div className={styles.summaryBadge}>
              <span>等級数</span>
              <strong>{config ? `${tiers.length}個` : "未設定"}</strong>
            </div>
          </aside>
        </header>

        <nav aria-label="進行ステップ" className={styles.stepper}>
          {stageLabels.map((item, index) => {
            const isActive = stageIndex === index;
            const isDone = stageIndex > index;

            return (
              <div
                className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ""} ${isDone ? styles.stepItemDone : ""}`}
                key={item.id}
              >
                <span className={styles.stepIndex}>{index + 1}</span>
                <span className={styles.stepLabel}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {safeStage === "setup" ? (
          <SetupScreen initialConfig={config} onSave={saveConfig} />
        ) : null}

        {safeStage === "confirm" && config ? (
          <ConfirmScreen config={config} onBack={editConfig} onStart={startDraw} />
        ) : null}

        {safeStage === "reveal" && config && session ? (
          <RevealScreen config={config} session={session} onNext={advancePrize} />
        ) : null}

        {safeStage === "complete" && config && session ? (
          <CompleteScreen
            config={config}
            session={session}
            onRestart={restartWithSameConfig}
            onReset={resetAll}
          />
        ) : null}
      </main>
    </div>
  );
}

