import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import dayjs from "dayjs";
import {
  computeQuickRange,
  toDateString,
} from "../utils/dateRangeUtils.js";
import { parseDoorState } from "../utils/doorStateUtils.js";

export function useSensorData(sensorData, deviceId) {
  const [expanded, setExpanded] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState([null, null]);

  // Precise ms timestamps for quick ranges (1h, 6h, etc.)
  const preciseRange = useRef(null);

  useEffect(() => {
    setPage(1);
    setExpanded(true);
  }, [deviceId]);

  useEffect(() => {
    setPage(1);
  }, [dateRange, typeFilter]);

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

  const data = useMemo(
    () => (Array.isArray(sensorData) ? sensorData : []),
    [sensorData],
  );

  const filteredData = useMemo(() => {
    let items = data;

    // Date filtering
    if (preciseRange.current) {
      const { from, to } = preciseRange.current;
      items = items.filter((d) => {
        const ts = d.timestamp ? new Date(d.timestamp).getTime() : null;
        if (!ts) return false;
        return ts >= from && ts <= to;
      });
    } else {
      const [start, end] = dateRange;
      if (start || end) {
        const fromTs = start ? dayjs(start).startOf("day").valueOf() : null;
        const toTs = end ? dayjs(end).endOf("day").valueOf() : null;
        items = items.filter((d) => {
          const ts = d.timestamp ? new Date(d.timestamp).getTime() : null;
          if (!ts) return false;
          if (fromTs != null && ts < fromTs) return false;
          if (toTs != null && ts > toTs) return false;
          return true;
        });
      }
    }

    // Type filtering
    if (typeFilter === "all") return items;
    return items.filter((d) => {
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
  }, [data, dateRange, typeFilter]);

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
    setDateRange: handleDateRangeChange,
    applyQuickRange,
    filteredData,
    pagedData,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  };
}
