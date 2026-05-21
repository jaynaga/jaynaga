// Templated narrative generation — no LLM dependency, swappable interface

export function generateNarrative(insights, anomalies, workoutPattern, datasetLabel) {
  if (!insights.length && !anomalies.length && !workoutPattern) {
    return "Your metrics are tracking close to your normal this week. No unusual signals — sleep, heart rate, and recovery are all within your typical range. A quiet week is genuinely good news.";
  }

  const parts = [];

  // Lead with the strongest insight
  const top = insights[0];
  if (top) {
    if (top.metric === "hrv" && top.direction === "down") {
      parts.push("Your recovery dipped this week.");
    } else if (top.metric === "hrv" && top.direction === "up") {
      parts.push("Your recovery is trending in the right direction this week.");
    } else if (top.metric === "restingHeartRate" && top.direction === "up") {
      parts.push("Your resting heart rate has been running higher than usual.");
    } else if (top.metric === "sleepHours" && top.direction === "down") {
      parts.push("You've been sleeping less than your usual this week.");
    } else {
      parts.push(`Your ${top.label.toLowerCase()} shifted noticeably this week.`);
    }
  }

  // Workout correlation
  if (workoutPattern && workoutPattern.occurrences >= 2) {
    parts.push(
      `This looks tied to ${workoutPattern.occurrences} high-intensity sessions — the pattern of next-day HRV dips after heavy load is consistent enough to be worth noting.`
    );
  }

  // Sleep context
  const sleepInsight = insights.find((i) => i.metric === "sleepHours");
  if (sleepInsight && sleepInsight.direction === "down" && top?.metric !== "sleepHours") {
    parts.push("Sleep duration is also down slightly, which compounds recovery stress.");
  } else if (!sleepInsight || sleepInsight.direction === "flat") {
    const hasBadHrv = insights.some((i) => i.metric === "hrv" && i.direction === "down");
    if (hasBadHrv) {
      parts.push("Sleep has held steady, which is the one bright spot.");
    }
  }

  // Closing frame — calibrated, never alarmist
  const hasNotable = insights.some((i) => i.confidence === "notable");
  const hasWorthWatching = insights.some((i) => i.confidence === "worth watching");

  if (hasNotable) {
    parts.push("Nothing here is alarming, but the pattern is consistent enough to take seriously. A few easier days would likely help.");
  } else if (hasWorthWatching) {
    parts.push("Nothing alarming — but worth watching if the trend continues into next week.");
  } else {
    parts.push("Overall a normal week. No action needed.");
  }

  return parts.join(" ");
}
