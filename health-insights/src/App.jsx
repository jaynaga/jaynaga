import { useState, useMemo } from "react";
import { recoveryDipDataset, boringWeekDataset } from "./data/sampleData";
import { computeInsights, computeAnomalies, computeWorkoutPattern, getSparklineData } from "./logic/interpret";
import { generateNarrative } from "./logic/narrative";
import NarrativeCard from "./components/NarrativeCard";
import InsightCard from "./components/InsightCard";
import AnomalyCard from "./components/AnomalyCard";
import DatasetSwitcher from "./components/DatasetSwitcher";
import "./App.css";

const DATASETS = {
  recovery: { label: "Recovery Dip", data: recoveryDipDataset },
  boring: { label: "Quiet Week", data: boringWeekDataset },
};

export default function App() {
  const [activeDataset, setActiveDataset] = useState("recovery");
  const records = DATASETS[activeDataset].data;

  const insights = useMemo(() => computeInsights(records), [records]);
  const anomalies = useMemo(() => computeAnomalies(records), [records]);
  const workoutPattern = useMemo(() => computeWorkoutPattern(records), [records]);
  const narrative = useMemo(
    () => generateNarrative(insights, anomalies, workoutPattern, DATASETS[activeDataset].label),
    [insights, anomalies, workoutPattern, activeDataset]
  );

  const sparkData = useMemo(
    () => ({
      hrv: getSparklineData(records, "hrv"),
      restingHeartRate: getSparklineData(records, "restingHeartRate"),
      sleepHours: getSparklineData(records, "sleepHours"),
    }),
    [records]
  );

  const lastDate = records[records.length - 1]?.date;
  const formattedDate = lastDate
    ? new Date(lastDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title-block">
            <span className="app-eyebrow">Health Insights</span>
            <h1 className="app-title">Your week in context</h1>
            <span className="app-date">{formattedDate}</span>
          </div>
          <DatasetSwitcher
            datasets={DATASETS}
            active={activeDataset}
            onChange={setActiveDataset}
          />
        </div>
      </header>

      <main className="app-main">
        <NarrativeCard narrative={narrative} />

        <section className="section">
          <h2 className="section-label">What shifted this week</h2>
          {insights.length > 0 ? (
            <div className="insights-grid">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.metric}
                  insight={insight}
                  sparkData={sparkData[insight.metric]}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card empty-state">
              <p className="empty-state-text">
                Your metrics are stable across the board. No meaningful shifts from your prior week.
              </p>
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section-label">Patterns &amp; anomalies</h2>
          <AnomalyCard
            anomalies={anomalies}
            workoutPattern={workoutPattern}
            records={records}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>Patterns, not prescriptions. Always apply your own judgment.</p>
      </footer>
    </div>
  );
}
