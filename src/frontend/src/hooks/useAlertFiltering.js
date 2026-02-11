import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
  paginate,
} from "../utils/dateRangeUtils.js";

export function useAlertFiltering(alerts, deviceId, defaultPerPage = 5) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);

  // Precise ms timestamps for quick ranges (1h, 6h, etc.)
  const preciseRange = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [deviceId, perPage]);

  useEffect(() => {
    setPage(1);
  }, [dateRange]);

  const applyQuickRange = useCallback((value) => {
    const { from, to } = computeQuickRange(value);
    if (value === "all") {
      preciseRange.current = null;
      setDateRange([null, null]);
    } else if (["1h", "6h", "24h"].includes(value)) {
      preciseRange.current = { from: from.getTime(), to: to.getTime() };
      setDateRange([dayjs(from), dayjs(to)]);
    } else {
      preciseRange.current = null;
      const fromStr = toDateString(from);
      const toStr = toDateString(to);
      setDateRange([
        fromStr ? dayjs(fromStr) : null,
        toStr ? dayjs(toStr) : null,
      ]);
    }
  }, []);

  const handleDateRangeChange = useCallback((newRange) => {
    preciseRange.current = null;
    setDateRange(newRange);
  }, []);

  const filteredAlerts = useMemo(() => {
    if (preciseRange.current) {
      const { from, to } = preciseRange.current;
      return alerts.filter((item) => {
        const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
        if (!ts) return false;
        return ts >= from && ts <= to;
      });
    }

    const [start, end] = dateRange;
    if (!start && !end) return alerts;

    const fromTs = start ? dayjs(start).startOf("day").valueOf() : null;
    const toTs = end ? dayjs(end).endOf("day").valueOf() : null;

    return alerts.filter((item) => {
      const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
      if (!ts) return false;
      if (fromTs != null && ts < fromTs) return false;
      if (toTs != null && ts > toTs) return false;
      return true;
    });
  }, [alerts, dateRange]);

  const totalItems = filteredAlerts.length;

  const pagedAlerts = useMemo(
    () => paginate(filteredAlerts, page, perPage),
    [filteredAlerts, page, perPage],
  );

  return {
    dateRange,
    setDateRange: handleDateRangeChange,
    applyQuickRange,
    perPage,
    setPerPage,
    page,
    setPage,
    filteredAlerts,
    pagedAlerts,
    totalItems,
  };
}
