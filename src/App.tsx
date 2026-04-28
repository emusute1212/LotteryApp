import { CompleteScreen } from "./components/CompleteScreen";
import { DrawingScreen } from "./components/DrawingScreen";
import { RevealScreen } from "./components/RevealScreen";
import { SetupScreen } from "./components/SetupScreen";
import { useLotteryStore } from "./store/useLotteryStore";
import styles from "./App.module.css";

export default function App() {
  const stage = useLotteryStore((state) => state.stage);
  const config = useLotteryStore((state) => state.config);
  const session = useLotteryStore((state) => state.session);
  const saveConfig = useLotteryStore((state) => state.saveConfig);
  const beginReveal = useLotteryStore((state) => state.beginReveal);
  const revealNextWinner = useLotteryStore((state) => state.revealNextWinner);
  const advancePrize = useLotteryStore((state) => state.advancePrize);
  const restartWithSameConfig = useLotteryStore((state) => state.restartWithSameConfig);
  const resetAll = useLotteryStore((state) => state.resetAll);
  const safeStage = config ? stage : "setup";

  return (
    <div className={`${styles.appShell} ${styles.appShellSetup}`}>
      <div className={`${styles.backgroundGlow} ${styles.backgroundGlowSetup}`} />
      <main className={`${styles.page} ${styles.pageSetup}`}>

        {safeStage === "setup" ? (
          <SetupScreen initialConfig={config} onSave={saveConfig} />
        ) : null}

        {safeStage === "drawing" && config && session ? (
          <DrawingScreen onReveal={beginReveal} />
        ) : null}

        {safeStage === "reveal" && config && session ? (
          <RevealScreen
            config={config}
            session={session}
            onRevealNext={revealNextWinner}
            onNextPrize={advancePrize}
          />
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
