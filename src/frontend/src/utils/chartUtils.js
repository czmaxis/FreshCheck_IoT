/**
 * Pure utility functions for chart formatting and calculations.
 */

const RANGE_DIFF_MS = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export function parseTimestamp(ts) {
  const d = new Date(ts);
  d.setHours(d.getHours());
  return d;
}

export function formatTime(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}\n${hours}:${minutes}`;
}

export function createAxisFormatter(timeSpanMs) {
  return (v) => {
    const d = new Date(v);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    if (timeSpanMs >= 24 * 60 * 60 * 1000) return `${day}.${month}`;
    if (timeSpanMs <= 2 * 60 * 60 * 1000) return `${hours}:${minutes}:${seconds}`;
    return `${hours}:${minutes}`;
  };
}

export function createSliderFormatter(sliderSpanMs) {
  return (v) => {
    if (!Number.isFinite(v)) return "-";
    const d = new Date(v);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    if (sliderSpanMs >= 24 * 60 * 60 * 1000) {
      return `${day}.${month} ${hours}:${minutes}`;
    }
    return `${hours}:${minutes}`;
  };
}

export function getTickCount(timeSpanMs, isMobile) {
  if (timeSpanMs === 0) return 5;
  if (isMobile) return 6;

  const hours = timeSpanMs / (60 * 60 * 1000);
  if (hours <= 2) return 12;
  if (hours <= 6) return 15;
  if (hours <= 24) return 18;
  if (hours <= 168) return 20;
  return 25;
}

export function filterByRange(sorted, range) {
  if (range === "all") {
    return sorted.map((d) => ({
      ...d,
      time: formatTime(new Date(d.ts)),
    }));
  }
  const from = Date.now() - RANGE_DIFF_MS[range];
  return sorted
    .filter((d) => d.ts >= from)
    .map((d) => ({ ...d, time: formatTime(new Date(d.ts)) }));
}

export function filterByDate(data, fromDate, toDate) {
  if (!fromDate && !toDate) return data;
  const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
  const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
  return data.filter((d) => {
    if (fromTs != null && d.ts < fromTs) return false;
    if (toTs != null && d.ts > toTs) return false;
    return true;
  });
}

export function filterAlertTimesByRange(alertTimes, range, fromDate, toDate) {
  if (alertTimes.length === 0) return [];
  let byRange;
  if (range === "all") {
    byRange = alertTimes;
  } else {
    const from = Date.now() - RANGE_DIFF_MS[range];
    byRange = alertTimes.filter((t) => t >= from);
  }
  if (!fromDate && !toDate) return byRange;
  const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
  const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
  return byRange.filter((t) => {
    if (fromTs != null && t < fromTs) return false;
    if (toTs != null && t > toTs) return false;
    return true;
  });
}

export function computeTemperatureDomain(visibleData, threshold) {
  const temps = visibleData
    .map((d) => d.temperature)
    .filter((v) => v != null && !Number.isNaN(v));
  const tMin = threshold?.temperature?.min;
  const tMax = threshold?.temperature?.max;

  let min = temps.length > 0 ? Math.min(...temps) : null;
  let max = temps.length > 0 ? Math.max(...temps) : null;

  if (tMin != null) min = min == null ? tMin : Math.min(min, tMin);
  if (tMax != null) max = max == null ? tMax : Math.max(max, tMax);

  if (min == null || max == null) return { min: "auto", max: "auto" };

  const rangeVal = max - min;
  const pad = rangeVal > 0 ? rangeVal * 0.1 : 1;
  return { min: min - pad, max: max + pad };
}

export function clampZoom(zoomRange, dataBounds) {
  if (!zoomRange || !dataBounds) return null;

  let [startTs, endTs] = zoomRange;
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs)) return null;
  if (startTs > endTs) [startTs, endTs] = [endTs, startTs];

  const { minTs, maxTs } = dataBounds;
  const spanMs = Math.max(0, endTs - startTs);

  if (startTs < minTs) {
    startTs = minTs;
    endTs = Math.min(minTs + spanMs, maxTs);
  }
  if (endTs > maxTs) {
    endTs = maxTs;
    startTs = Math.max(maxTs - spanMs, minTs);
  }

  startTs = Math.max(startTs, minTs);
  endTs = Math.min(endTs, maxTs);

  return [startTs, endTs];
}
