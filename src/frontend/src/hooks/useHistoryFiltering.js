import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
  paginate,
} from "../utils/dateRangeUtils.js";

export function useHistoryFiltering(alerts, selectedDeviceId, defaultPerPage = 10) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);

  // Precise ms timestamps for quick ranges (1h, 6h, etc.)
  const preciseRange = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [perPage, selectedDeviceId, dateRange, statusFilter, typeFilter]);

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

  const resetFilters = useCallback(() => {
    preciseRange.current = null;
    setStatusFilter("all");
    setTypeFilter("all");
    setDateRange([null, null]);
  }, []);

  const filteredAlerts = useMemo(() => {
    let items = alerts;

    if (statusFilter === "active") items = items.filter((a) => a.active);
    if (statusFilter === "resolved") items = items.filter((a) => !a.active);
    if (typeFilter !== "all") items = items.filter((a) => a.type === typeFilter);

    if (preciseRange.current) {
      const { from, to } = preciseRange.current;
      return items.filter((item) => {
        const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
        if (!ts) return false;
        return ts >= from && ts <= to;
      });
    }

    const [start, end] = dateRange;
    if (!start && !end) return items;

    const fromTs = start ? dayjs(start).startOf("day").valueOf() : null;
    const toTs = end ? dayjs(end).endOf("day").valueOf() : null;

    return items.filter((item) => {
      const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
      if (!ts) return false;
      if (fromTs != null && ts < fromTs) return false;
      if (toTs != null && ts > toTs) return false;
      return true;
    });
  }, [alerts, statusFilter, typeFilter, dateRange]);

  const totalItems = filteredAlerts.length;

  const pagedAlerts = useMemo(
    () => paginate(filteredAlerts, page, perPage),
    [filteredAlerts, page, perPage],
  );

  return {
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
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
    resetFilters,
  };
}
