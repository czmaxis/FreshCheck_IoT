import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
  filterAlertsByDate,
  paginate,
} from "../utils/dateRangeUtils.js";

export function useAlertFiltering(alerts, deviceId, defaultPerPage = 5) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [deviceId, perPage]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

  const applyQuickRange = useCallback((value) => {
    const { from, to } = computeQuickRange(value);
    const fromStr = toDateString(from);
    const toStr = toDateString(to);
    setFromDate(fromStr);
    setToDate(toStr);
    setDateRange([
      fromStr ? dayjs(fromStr) : null,
      toStr ? dayjs(toStr) : null,
    ]);
  }, []);

  const filteredAlerts = useMemo(
    () => filterAlertsByDate(alerts, fromDate, toDate),
    [alerts, fromDate, toDate],
  );

  const totalItems = filteredAlerts.length;

  const pagedAlerts = useMemo(
    () => paginate(filteredAlerts, page, perPage),
    [filteredAlerts, page, perPage],
  );

  return {
    fromDate,
    toDate,
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
  };
}
