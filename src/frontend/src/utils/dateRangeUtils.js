import dayjs from "dayjs";

export const PER_PAGE_OPTIONS_ACTIVE = [1, 5, 10, 20];

export function computeQuickRange(value) {
  const now = new Date();

  if (value === "all") return { from: null, to: null };

  if (value === "1h") {
    return { from: new Date(now.getTime() - 60 * 60 * 1000), to: now };
  }
  if (value === "6h") {
    return { from: new Date(now.getTime() - 6 * 60 * 60 * 1000), to: now };
  }
  if (value === "24h") {
    return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000), to: now };
  }
  if (value === "7d") {
    return {
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: now,
    };
  }
  if (value === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return {
      from: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0),
      to: new Date(
        y.getFullYear(),
        y.getMonth(),
        y.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }
  if (value === "thisWeek") {
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (day - 1));
    return {
      from: new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0,
      ),
      to: now,
    };
  }

  return { from: null, to: null };
}

export function toDateString(date) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function filterAlertsByDate(alerts, fromDate, toDate) {
  return alerts.filter((a) => {
    const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
    if (!ts) return false;
    if (fromDate) {
      const fromTs = new Date(fromDate).setHours(0, 0, 0, 0);
      if (ts < fromTs) return false;
    }
    if (toDate) {
      const toTs = new Date(toDate).setHours(23, 59, 59, 999);
      if (ts > toTs) return false;
    }
    return true;
  });
}

export function getAlertIdsInRange(
  alerts,
  rangeValue,
  { activeOnly = false } = {},
) {
  const now = new Date();
  let from = null;
  if (rangeValue === "1h")
    from = new Date(now.getTime() - 60 * 60 * 1000);
  else if (rangeValue === "6h")
    from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  else if (rangeValue === "24h")
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (rangeValue === "7d")
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fromTs = from ? from.getTime() : null;
  return alerts
    .filter((a) => {
      if (activeOnly && !a.active) return false;
      const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
      if (!ts) return false;
      if (fromTs != null && ts < fromTs) return false;
      return true;
    })
    .map((a) => a._id)
    .filter(Boolean);
}

export function getAlertIdsInCustomRange(
  alerts,
  startDayjs,
  endDayjs,
  { activeOnly = false } = {},
) {
  const fromTs = dayjs(startDayjs).startOf("day").valueOf();
  const toTs = dayjs(endDayjs).endOf("day").valueOf();
  return alerts
    .filter((a) => {
      if (activeOnly && !a.active) return false;
      const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
      if (!ts) return false;
      if (ts < fromTs || ts > toTs) return false;
      return true;
    })
    .map((a) => a._id)
    .filter(Boolean);
}

export function paginate(items, page, perPage) {
  return items.slice((page - 1) * perPage, page * perPage);
}
