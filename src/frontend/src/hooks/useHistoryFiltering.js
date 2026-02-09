import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
  paginate,
} from "../utils/dateRangeUtils.js";

export function useHistoryFiltering(alerts, selectedDeviceId, defaultPerPage = 10) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const [start, end] = dateRange;
    setDateFrom(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setDateTo(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [perPage, selectedDeviceId, dateFrom, dateTo, statusFilter, typeFilter]);

  const applyQuickRange = useCallback((value) => {
    const { from, to } = computeQuickRange(value);
    const fromStr = toDateString(from);
    const toStr = toDateString(to);
    setDateFrom(fromStr);
    setDateTo(toStr);
    setDateRange([
      fromStr ? dayjs(fromStr) : null,
      toStr ? dayjs(toStr) : null,
    ]);
  }, []);

  const resetFilters = useCallback(() => {
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setDateRange([null, null]);
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (statusFilter === "active" && !alert.active) return false;
      if (statusFilter === "resolved" && alert.active) return false;
      if (typeFilter !== "all" && alert.type !== typeFilter) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        const alertDate = new Date(alert.timestamp);
        if (alertDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        const alertDate = new Date(alert.timestamp);
        if (alertDate > to) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, typeFilter, dateFrom, dateTo]);

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
    dateFrom,
    dateTo,
    dateRange,
    setDateRange,
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
