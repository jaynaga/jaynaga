import "./AnomalyCard.css";

const METRIC_UNITS = {
  hrv: "ms",
  restingHeartRate: "bpm",
  sleepHours: "hrs",
};

function formatValue(metric, value) {
  if (metric === "sleepHours") return value.toFixed(1);
  return Math.round(value);
}

export default function AnomalyCard({ anomalies, workoutPattern }) {
  const hasContent = anomalies.length > 0 || workoutPattern;

  if (!hasContent) {
    return (
      <div className="glass-card anomaly-empty">
        <div className="anomaly-empty-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <p className="anomaly-empty-title">No notable signals this week</p>
          <p className="anomaly-empty-body">
            Your metrics are tracking close to your normal. No single-day spikes, no unusual patterns. A quiet week is a good week.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-items">
      {workoutPattern && (
        <div className="glass-card anomaly-item anomaly-item--pattern">
          <div className="anomaly-item-icon anomaly-item-icon--pattern" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="anomaly-item-content">
            <span className="anomaly-item-label">Load-recovery pattern</span>
            <p className="anomaly-item-text">
              On {workoutPattern.occurrences} occasions this month, high-intensity sessions (avg load {workoutPattern.avgLoad}/100) were followed by a next-day HRV drop or elevated resting heart rate. This is a consistent pattern, not a one-off — worth factoring into how you schedule hard efforts.
            </p>
            <span className="anomaly-item-caveat">Pattern, not proven cause</span>
          </div>
        </div>
      )}

      {anomalies.map((a, i) => {
        const dir = a.deviations > 0 ? "above" : "below";
        const isWorrying =
          (a.metric === "hrv" && a.deviations < 0) ||
          (a.metric === "restingHeartRate" && a.deviations > 0) ||
          (a.metric === "sleepHours" && a.deviations < 0);

        return (
          <div key={i} className={`glass-card anomaly-item ${isWorrying ? "anomaly-item--warn" : "anomaly-item--positive"}`}>
            <div className={`anomaly-item-icon ${isWorrying ? "anomaly-item-icon--warn" : "anomaly-item-icon--positive"}`} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {isWorrying ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                ) : (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                )}
              </svg>
            </div>
            <div className="anomaly-item-content">
              <span className="anomaly-item-label">Single-day anomaly · {a.label}</span>
              <p className="anomaly-item-text">
                On {new Date(a.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })},{" "}
                {a.label.toLowerCase()} hit {formatValue(a.metric, a.value)} {METRIC_UNITS[a.metric]}{" "}
                — {Math.abs(a.deviations).toFixed(1)} standard deviations {dir} your personal baseline of {formatValue(a.metric, a.baseline)} {METRIC_UNITS[a.metric]}.
              </p>
              <span className="anomaly-item-caveat">Single data point</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
