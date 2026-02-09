import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";
import {
  parseTimestamp,
  filterByRange,
  filterByDate,
  filterAlertTimesByRange,
  computeTemperatureDomain,
  clampZoom,
} from "../utils/chartUtils.js";

export function useChartData(deviceId, refreshKey) {
  const { token } = useAuth();

  const [rawData, setRawData] = useState([]);
  const [threshold, setThreshold] = useState(null);
  const [alertTimes, setAlertTimes] = useState([]);
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [zoomRange, setZoomRange] = useState(null);

  // --- Data fetching ---
  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [data, alerts, device] = await Promise.all([
          getSensorData(deviceId, token),
          getAlerts(deviceId, {}, token),
          getDevice(deviceId, token),
        ]);
        if (cancelled) return;

        setRawData(
          data.map((it) => ({
            ts: parseTimestamp(it.timestamp).getTime(),
            temperature: it.temperature != null ? Number(it.temperature) : null,
            humidity: it.humidity != null ? Number(it.humidity) : null,
          })),
        );
        setThreshold(device?.threshold ?? null);
        const alertTs = Array.isArray(alerts)
          ? alerts
              .map((a) => parseTimestamp(a.timestamp).getTime())
              .filter((t) => !Number.isNaN(t))
          : [];
        setAlertTimes(alertTs);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání dat",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId, token, refreshKey]);

  // --- Date range sync ---
  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  // --- Sorted raw data ---
  const sorted = useMemo(
    () => [...rawData].sort((a, b) => a.ts - b.ts),
    [rawData],
  );

  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  // --- Filtering chain ---
  const filteredData = useMemo(
    () => filterByRange(sorted, range),
    [sorted, range],
  );

  const dateFilteredData = useMemo(
    () => filterByDate(filteredData, fromDate, toDate),
    [filteredData, fromDate, toDate],
  );

  const dataBounds = useMemo(() => {
    const len = dateFilteredData.length;
    if (!len) return null;
    return { minTs: dateFilteredData[0].ts, maxTs: dateFilteredData[len - 1].ts };
  }, [dateFilteredData]);

  // --- Zoom ---
  useEffect(() => {
    setZoomRange(null);
  }, [deviceId, range, fromDate, toDate]);

  useEffect(() => {
    if (!zoomRange || !dataBounds) return;
    const clamped = clampZoom(zoomRange, dataBounds);
    if (!clamped) {
      setZoomRange(null);
      return;
    }
    if (clamped[0] !== zoomRange[0] || clamped[1] !== zoomRange[1]) {
      setZoomRange(clamped);
    }
  }, [zoomRange, dataBounds]);

  const chartData = useMemo(() => {
    if (!zoomRange) return dateFilteredData;
    const start = Math.min(zoomRange[0], zoomRange[1]);
    const end = Math.max(zoomRange[0], zoomRange[1]);
    return dateFilteredData.filter((d) => d.ts >= start && d.ts <= end);
  }, [dateFilteredData, zoomRange]);

  const filteredAlertTimes = useMemo(
    () => filterAlertTimesByRange(alertTimes, range, fromDate, toDate),
    [alertTimes, range, fromDate, toDate],
  );

  const temperatureDomain = useMemo(
    () => computeTemperatureDomain(chartData, threshold),
    [chartData, threshold],
  );

  // --- Time spans ---
  const timeSpanMs = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(0, chartData[chartData.length - 1].ts - chartData[0].ts);
  }, [chartData]);

  const sliderSpanMs = useMemo(() => {
    if (!dataBounds) return 0;
    return Math.max(0, dataBounds.maxTs - dataBounds.minTs);
  }, [dataBounds]);

  // --- Actions ---
  const applyQuickRange = useCallback((value) => {
    if (!value) return;
    setRange(value);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return {
    latest,
    threshold,
    range,
    dateRange,
    setDateRange,
    loading,
    error,
    expanded,
    toggle,
    zoomRange,
    setZoomRange,
    dateFilteredData,
    dataBounds,
    chartData,
    filteredAlertTimes,
    temperatureDomain,
    timeSpanMs,
    sliderSpanMs,
    applyQuickRange,
    resetZoom,
  };
}
