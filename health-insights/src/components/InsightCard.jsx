import { ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import "./InsightCard.css";

const DIRECTION_ICONS = {
  up: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  down: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  flat: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

// Whether a direction is "good" depends on the metric
function isBenign(metric, direction) {
  if (metric === "hrv") return direction === "up";
  if (metric === "restingHeartRate") return direction === "down";
  if (metric === "sleepHours") return direction === "up";
  return direction === "up";
}

const CONFIDENCE_LABELS = {
  notable: "Notable",
  "worth watching": "Worth watching",
  "low signal": "Low signal",
};

export default function InsightCard({ insight, sparkData }) {
  const { metric, label, direction, magnitude, soWhat, confidence } = insight;
  const benign = isBenign(metric, direction);

  const sparkColor = benign
    ? "rgba(111, 207, 151, 0.85)"
    : confidence === "notable"
    ? "rgba(247, 183, 49, 0.85)"
    : "rgba(252, 92, 125, 0.75)";

  const dirColor = benign ? "var(--accent-green)" : confidence === "notable" ? "var(--accent-amber)" : "var(--accent-rose)";

  const sparkMin = sparkData ? Math.min(...sparkData.map((d) => d.value).filter(Boolean)) * 0.97 : 0;
  const sparkMax = sparkData ? Math.max(...sparkData.map((d) => d.value).filter(Boolean)) * 1.03 : 100;

  return (
    <div className={`insight-card glass-card ${confidence === "notable" ? "insight-card--notable" : ""}`}>
      <div className="insight-top">
        <div className="insight-left">
          <div className="insight-header">
            <span className="insight-metric-label">{label}</span>
            <span
              className="insight-badge"
              style={{
                color: confidence === "notable" ? "var(--accent-amber)" : confidence === "worth watching" ? "var(--accent-teal)" : "var(--text-tertiary)",
                background: confidence === "notable" ? "rgba(247,183,49,0.12)" : confidence === "worth watching" ? "rgba(78,205,196,0.12)" : "rgba(255,255,255,0.06)",
                borderColor: confidence === "notable" ? "rgba(247,183,49,0.25)" : confidence === "worth watching" ? "rgba(78,205,196,0.2)" : "rgba(255,255,255,0.08)",
              }}
            >
              {CONFIDENCE_LABELS[confidence]}
            </span>
          </div>
          <div className="insight-magnitude" style={{ color: dirColor }}>
            <span className="insight-dir-icon">{DIRECTION_ICONS[direction]}</span>
            <span>{magnitude}</span>
          </div>
        </div>

        {sparkData && (
          <div className="insight-spark" aria-hidden="true">
            <ResponsiveContainer width="100%" height={48}>
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  strokeWidth={1.75}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={sparkData ? sparkData.reduce((s, d) => s + (d.value || 0), 0) / sparkData.length : 0}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className="insight-so-what">{soWhat}</p>
    </div>
  );
}
