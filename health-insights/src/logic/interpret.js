// Pure interpretation functions — all rules explicit and readable

function mean(arr) {
  const valid = arr.filter((v) => v !== null && v !== undefined);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function stddev(arr) {
  const valid = arr.filter((v) => v !== null && v !== undefined);
  if (valid.length < 2) return null;
  const m = mean(valid);
  return Math.sqrt(valid.reduce((sum, v) => sum + (v - m) ** 2, 0) / valid.length);
}

// 7-day rolling average for a field across all records
export function rollingAverage(records, field, windowSize = 7) {
  return records.map((_, i) => {
    const window = records.slice(Math.max(0, i - windowSize + 1), i + 1);
    return mean(window.map((r) => r[field]));
  });
}

// Compare recent 7 days vs prior 7 days for a metric
// Returns { recentAvg, priorAvg, changePct, direction }
function weekOverWeek(records, field) {
  const recent = records.slice(-7).map((r) => r[field]);
  const prior = records.slice(-14, -7).map((r) => r[field]);
  const recentAvg = mean(recent);
  const priorAvg = mean(prior);
  if (recentAvg === null || priorAvg === null || priorAvg === 0) return null;
  const changePct = ((recentAvg - priorAvg) / priorAvg) * 100;
  const direction = changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat";
  return { recentAvg, priorAvg, changePct, direction };
}

// Detect anomalies: last 7 days values >2 SD from full-dataset baseline
function detectAnomalies(records, field) {
  const allValues = records.map((r) => r[field]).filter((v) => v !== null);
  const baseline = mean(allValues);
  const sd = stddev(allValues);
  if (!sd) return [];

  return records
    .slice(-7)
    .filter((r) => r[field] !== null && Math.abs(r[field] - baseline) > 2 * sd)
    .map((r) => ({
      date: r.date,
      value: r[field],
      baseline,
      deviations: (r[field] - baseline) / sd,
    }));
}

// Correlate high workoutLoad days to next-day HRV/RHR changes
// Returns a pattern object if found, null if not
function detectWorkoutRecoveryPattern(records) {
  const heavyDays = records.filter((r, i) => {
    if (r.workoutLoad === null || r.workoutLoad < 70) return false;
    // Check next day exists and has lower HRV or higher RHR
    const next = records[i + 1];
    if (!next) return false;
    const hrvDrop = r.hrv !== null && next.hrv !== null && next.hrv < r.hrv * 0.9;
    const rhrRise = r.restingHeartRate !== null && next.restingHeartRate !== null && next.restingHeartRate > r.restingHeartRate * 1.04;
    return hrvDrop || rhrRise;
  });

  if (heavyDays.length < 2) return null;

  const avgLoad = mean(heavyDays.map((r) => r.workoutLoad));
  return {
    occurrences: heavyDays.length,
    avgLoad: Math.round(avgLoad),
    dates: heavyDays.map((r) => r.date),
  };
}

// Thresholds for "notable" trend flagging
const TREND_THRESHOLDS = {
  hrv: { down: -8, up: 8 },          // % change
  restingHeartRate: { up: 5, down: -5 },
  sleepHours: { down: -8, up: 8 },
};

function confidenceFromMagnitude(pct, field) {
  const abs = Math.abs(pct);
  const thresholds = TREND_THRESHOLDS[field];
  if (!thresholds) return "low signal";
  const trigger = Math.abs(field === "hrv" ? thresholds.down : thresholds.up);
  if (abs >= trigger * 1.5) return "notable";
  if (abs >= trigger) return "worth watching";
  return "low signal";
}

function formatMagnitude(changePct, recentAvg, field) {
  const abs = Math.abs(changePct).toFixed(0);
  const dir = changePct > 0 ? "higher" : "lower";
  const labels = {
    hrv: `${abs}% ${dir} than your prior week (avg ${Math.round(recentAvg)} ms)`,
    restingHeartRate: `${abs}% ${dir} than your prior week (avg ${Math.round(recentAvg)} bpm)`,
    sleepHours: `${abs}% ${dir} than your prior week (avg ${recentAvg.toFixed(1)} hrs)`,
    steps: `${abs}% ${dir} than your prior week`,
  };
  return labels[field] || `${abs}% ${dir} than your prior week`;
}

const SO_WHAT = {
  hrv: {
    down: (conf) =>
      conf === "notable"
        ? "HRV is your clearest recovery signal. A sustained drop like this usually means your body is working harder than it's recovering. Worth pausing high-intensity sessions until it rebounds."
        : "A modest HRV dip. Worth tracking — if it continues another week, consider dialing back intensity.",
    up: () => "Your nervous system is recovering well. This is a good window for higher intensity training if you're planning it.",
    flat: () => "HRV is holding steady. No action needed.",
  },
  restingHeartRate: {
    up: (conf) =>
      conf === "notable"
        ? "Elevated resting heart rate over a full week is a reliable sign of accumulated stress — physical or otherwise. Prioritize sleep and recovery over the next few days."
        : "RHR is nudging upward. Not alarming on its own, but keep an eye on it alongside HRV.",
    down: () => "Resting heart rate trending down is a positive sign — your cardiovascular system is adapting well.",
    flat: () => "Resting heart rate is stable. No concerns.",
  },
  sleepHours: {
    down: (conf) =>
      conf === "notable"
        ? "You've been sleeping significantly less than your norm. Sleep is the single biggest lever for recovery — this likely explains any HRV or RHR changes you're seeing."
        : "Sleep is slightly shorter than usual. Not alarming yet, but sleep debt compounds quickly.",
    up: () => "You're getting more sleep than usual. Your body will thank you for it.",
    flat: () => "Sleep duration is consistent. Good baseline.",
  },
};

function soWhatForMetric(field, direction, confidence) {
  const metric = SO_WHAT[field];
  if (!metric) return null;
  const fn = metric[direction];
  if (!fn) return null;
  return typeof fn === "function" ? fn(confidence) : fn;
}

const METRIC_LABELS = {
  hrv: "HRV",
  restingHeartRate: "Resting Heart Rate",
  sleepHours: "Sleep",
  steps: "Steps",
};

export function computeInsights(records) {
  const insights = [];
  const metricsToAnalyze = ["hrv", "restingHeartRate", "sleepHours"];

  for (const field of metricsToAnalyze) {
    const wow = weekOverWeek(records, field);
    if (!wow) continue;

    const { changePct, direction, recentAvg } = wow;
    const absChange = Math.abs(changePct);
    const threshold = Math.abs(
      TREND_THRESHOLDS[field]?.[direction === "down" ? "down" : "up"] ?? 5
    );

    if (absChange < threshold * 0.5) continue; // Too small to surface

    const confidence = confidenceFromMagnitude(changePct, field);
    const soWhat = soWhatForMetric(field, direction, confidence);
    if (!soWhat) continue;

    insights.push({
      metric: field,
      label: METRIC_LABELS[field],
      direction,
      magnitude: formatMagnitude(changePct, recentAvg, field),
      soWhat,
      confidence,
      recentAvg,
      changePct,
    });
  }

  // Sort: notable first
  insights.sort((a, b) => {
    const order = { notable: 0, "worth watching": 1, "low signal": 2 };
    return order[a.confidence] - order[b.confidence];
  });

  return insights.slice(0, 3); // Max 3 callouts
}

export function computeAnomalies(records) {
  const anomalies = [];
  for (const field of ["hrv", "restingHeartRate", "sleepHours"]) {
    const found = detectAnomalies(records, field);
    for (const a of found) {
      anomalies.push({ ...a, metric: field, label: METRIC_LABELS[field] });
    }
  }
  return anomalies;
}

export function computeWorkoutPattern(records) {
  return detectWorkoutRecoveryPattern(records);
}

export function getSparklineData(records, field) {
  return records.slice(-14).map((r) => ({
    date: r.date,
    value: r[field],
  }));
}
