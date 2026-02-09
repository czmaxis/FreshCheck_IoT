import { useEffect, useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { computeQuickRange, toDateString } from "../utils/dateRangeUtils.js";

function parseDoorState(item) {
  if (item?.doors === true || item?.doors === 1 || item?.doors === "1") {
    return 1;
  }
  if (item?.doors === false || item?.doors === 0 || item?.doors === "0") {
    return 0;
  }

  const illuminance = item?.illuminance;
  if (illuminance === undefined || illuminance === null) return null;
  if (Number.isNaN(Number(illuminance))) return null;
  return Number(illuminance) > 0 ? 1 : 0;
}

export function useSensorData(deviceId, refreshKey) {
  const { token } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    if (!deviceId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const resp = await getSensorData(deviceId, token);
        const arr = Array.isArray(resp) ? resp : [resp];
        if (!cancelled) setData(arr);
      } catch (err) {
        console.error("Chyba při načítání sensor dat:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání sensor dat.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId, token, refreshKey]);

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

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      const ts = d.timestamp ? new Date(d.timestamp).getTime() : null;
      if (!ts) return false;
      if (fromDate) {
        const fromTs = new Date(fromDate).setHours(0, 0, 0, 0);
        if (ts < fromTs) return false;
      }
      if (toDate) {
        const toTs = new Date(toDate).setHours(23, 59, 59, 999);
        if (ts > toTs) return false;
      }

      if (typeFilter === "all") return true;
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
    setData,
    loading,
    error,
    setError,
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
