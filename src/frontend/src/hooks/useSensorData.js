import { useEffect, useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
  filterByTimestamp,
} from "../utils/dateRangeUtils.js";
import { parseDoorState } from "../utils/doorStateUtils.js";

export function useSensorData(sensorData, deviceId) {
  const [expanded, setExpanded] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    setPage(1);
    setExpanded(true);
  }, [deviceId]);

  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, typeFilter]);

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

  const data = useMemo(
    () => (Array.isArray(sensorData) ? sensorData : []),
    [sensorData],
  );

  const filteredData = useMemo(() => {
    const dateFiltered = filterByTimestamp(data, fromDate, toDate);
    if (typeFilter === "all") return dateFiltered;
    return dateFiltered.filter((d) => {
      if (typeFilter === "temperature") {
        return d.temperature != null && !Number.isNaN(Number(d.temperature));
      }
      if (typeFilter === "humidity") {
        return d.humidity != null && !Number.isNaN(Number(d.humidity));
      }
      if (typeFilter === "doorOpen") {
        return parseDoorState(d) === 1;
      }
      if (typeFilter === "doorClosed") {
        return parseDoorState(d) === 0;
      }
      return true;
    });
  }, [data, fromDate, toDate, typeFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const toggleExpandAll = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return {
    data,
    expanded,
    toggleExpandAll,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    dateRange,
    setDateRange,
    applyQuickRange,
    filteredData,
    pagedData,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  };
}
