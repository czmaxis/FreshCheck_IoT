import { getAlertTitle } from "../components/AlertCard.jsx";

/**
 * Returns a grouping key for an alert, e.g. "temperature_high", "humidity_low", "door".
 */
function getGroupKey(alert) {
  const title = getAlertTitle(alert);
  return `${alert.type}_${title}`;
}

/**
 * Groups an array of alerts by type + direction (high/low).
 * Returns an array of group objects sorted by latest timestamp DESC.
 */
export function groupAlerts(alerts) {
  if (!alerts || alerts.length === 0) return [];

  const map = {};

  for (const alert of alerts) {
    const key = getGroupKey(alert);

    if (!map[key]) {
      map[key] = {
        key,
        type: alert.type,
        title: getAlertTitle(alert),
        alerts: [],
        count: 0,
        minValue: Infinity,
        maxValue: -Infinity,
        latestTimestamp: null,
        oldestTimestamp: null,
        threshold: alert.alertTreshold ?? alert.threshold ?? null,
      };
    }

    const group = map[key];
    group.alerts.push(alert);
    group.count++;

    const v = Number(alert.value);
    if (!Number.isNaN(v)) {
      if (v < group.minValue) group.minValue = v;
      if (v > group.maxValue) group.maxValue = v;
    }

    const ts = alert.timestamp ? new Date(alert.timestamp).getTime() : 0;
    const latestTs = group.latestTimestamp
      ? new Date(group.latestTimestamp).getTime()
      : 0;
    const oldestTs = group.oldestTimestamp
      ? new Date(group.oldestTimestamp).getTime()
      : Infinity;

    if (ts > latestTs) group.latestTimestamp = alert.timestamp;
    if (ts < oldestTs) group.oldestTimestamp = alert.timestamp;
  }

  return Object.values(map).sort(
    (a, b) =>
      new Date(b.latestTimestamp).getTime() -
      new Date(a.latestTimestamp).getTime(),
  );
}
