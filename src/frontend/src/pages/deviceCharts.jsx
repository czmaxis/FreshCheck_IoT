import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import "dayjs/locale/cs";
import dayjs from "dayjs";

import TimeRangeSelector from "../components/TimeRangeSelector.jsx";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  Brush,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";

function parseTimestamp(ts) {
  const d = new Date(ts);
  d.setHours(d.getHours());
  return d;
}

function formatTime(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}.${month}\n${hours}:${minutes}`;
}

export default function DeviceCharts({ deviceId, refreshKey, limitsLoading }) {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [rawData, setRawData] = useState([]);
  const [threshold, setThreshold] = useState(null);
  const [alertTimes, setAlertTimes] = useState([]);
  const [range, setRange] = useState("24h");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [zoomResetKey, setZoomResetKey] = useState(0);
  const [brushWindow, setBrushWindow] = useState(null);

  const sorted = [...rawData].sort((a, b) => a.ts - b.ts);
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
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

  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  const filteredData = useMemo(() => {
    if (range === "all") {
      return sorted.map((d) => ({
        ...d,
        time: formatTime(new Date(d.ts)),
      }));
    }

    const now = Date.now();
    const diffMap = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const from = now - diffMap[range];

    const byRange = sorted
      .filter((d) => d.ts >= from)
      .map((d) => ({
        ...d,
        time: formatTime(new Date(d.ts)),
      }));
    return byRange;
  }, [sorted, range]);

  const dateFilteredData = useMemo(() => {
    if (!fromDate && !toDate) return filteredData;
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
    return filteredData.filter((d) => {
      if (fromTs != null && d.ts < fromTs) return false;
      if (toTs != null && d.ts > toTs) return false;
      return true;
    });
  }, [filteredData, fromDate, toDate]);

  const filteredAlertTimes = useMemo(() => {
    if (alertTimes.length === 0) return [];
    if (range === "all") return alertTimes;

    const now = Date.now();
    const diffMap = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    const from = now - diffMap[range];
    const byRange = alertTimes.filter((t) => t >= from);
    if (!fromDate && !toDate) return byRange;
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
    return byRange.filter((t) => {
      if (fromTs != null && t < fromTs) return false;
      if (toTs != null && t > toTs) return false;
      return true;
    });
  }, [alertTimes, range, fromDate, toDate]);

  const visibleData = dateFilteredData;

  const temperatureDomain = useMemo(() => {
    const temps = visibleData
      .map((d) => d.temperature)
      .filter((v) => v != null && !Number.isNaN(v));
    const tMin = threshold?.temperature?.min;
    const tMax = threshold?.temperature?.max;

    let min = temps.length > 0 ? Math.min(...temps) : null;
    let max = temps.length > 0 ? Math.max(...temps) : null;

    if (tMin != null) min = min == null ? tMin : Math.min(min, tMin);
    if (tMax != null) max = max == null ? tMax : Math.max(max, tMax);

    if (min == null || max == null) {
      return { min: "auto", max: "auto" };
    }

    const rangeVal = max - min;
    const pad = rangeVal > 0 ? rangeVal * 0.1 : 1;
    return { min: min - pad, max: max + pad };
  }, [visibleData, threshold?.temperature?.min, threshold?.temperature?.max]);

  const toggle = () => setExpanded((v) => !v);

  const applyQuickRange = (value) => {
    if (!value) return;
    setRange(value);
  };

  // dynamic label interval based on density
  const tickInterval =
    dateFilteredData.length > (isMobile ? 20 : 30)
      ? Math.ceil(dateFilteredData.length / (isMobile ? 6 : 10))
      : 0;

  const timeSpanMs = useMemo(() => {
    if (dateFilteredData.length === 0) return 0;
    const minTs = dateFilteredData[0].ts;
    const maxTs = dateFilteredData[dateFilteredData.length - 1].ts;
    return Math.max(0, maxTs - minTs);
  }, [dateFilteredData]);

  const formatAxisTime = (v) => {
    const d = new Date(v);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    // Prefer day-level labels for multi-day ranges
    if (timeSpanMs >= 24 * 60 * 60 * 1000) {
      return `${day}.${month}`;
    }

    // Prefer more detailed time for very short ranges (~1h)
    if (timeSpanMs <= 2 * 60 * 60 * 1000) {
      return `${hours}:${minutes}:${seconds}`;
    }

    // Default: hour:minute
    return `${hours}:${minutes}`;
  };
  const defaultBrushWindow = useMemo(() => {
    const len = dateFilteredData.length;
    if (len === 0) return { startIndex: 0, endIndex: 0 };
    if (range === "all" && len > 120) {
      return { startIndex: len - 120, endIndex: len - 1 };
    }
    return { startIndex: 0, endIndex: len - 1 };
  }, [dateFilteredData.length, range]);

  useEffect(() => {
    setBrushWindow(defaultBrushWindow);
  }, [defaultBrushWindow, zoomResetKey]);

  const resetZoom = () => {
    setZoomResetKey((k) => k + 1);
  };

  const findClosestIndexByTs = (targetTs) => {
    const data = dateFilteredData;
    if (!data.length) return 0;
    let lo = 0;
    let hi = data.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const ts = data[mid].ts;
      if (ts === targetTs) return mid;
      if (ts < targetTs) lo = mid + 1;
      else hi = mid - 1;
    }
    if (lo >= data.length) return data.length - 1;
    if (lo <= 0) return 0;
    const prev = data[lo - 1].ts;
    const next = data[lo].ts;
    return Math.abs(prev - targetTs) <= Math.abs(next - targetTs) ? lo - 1 : lo;
  };

  const handleBrushChange = (next) => {
    if (!next) return;
    const { startIndex, endIndex } = next;
    if (startIndex == null || endIndex == null) return;
    const data = dateFilteredData;
    if (!data.length) return;

    const startTs = data[startIndex]?.ts;
    const endTs = data[endIndex]?.ts;
    if (!startTs || !endTs) return;

    const startHour = dayjs(startTs).startOf("hour").valueOf();
    const endHour = dayjs(endTs).endOf("hour").valueOf();

    const snappedStart = findClosestIndexByTs(startHour);
    const snappedEnd = findClosestIndexByTs(endHour);

    const nextWindow = {
      startIndex: Math.min(snappedStart, snappedEnd),
      endIndex: Math.max(snappedStart, snappedEnd),
    };

    if (
      !brushWindow ||
      brushWindow.startIndex !== nextWindow.startIndex ||
      brushWindow.endIndex !== nextWindow.endIndex
    ) {
      setBrushWindow(nextWindow);
    }
  };

  return (
    <Box
      p={{ xs: 1.5, sm: 3 }}
      mt={{ xs: 2, sm: 4 }}
      sx={{ maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box
        display="flex"
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
      >
        <Typography variant="h5">Grafy (teplota / vlhkost)</Typography>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <TimeRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
            label="Zobrazit"
          />

          <Button
            size="small"
            variant="outlined"
            onClick={toggle}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" } }}
          >
            {expanded ? "Skrýt" : "Zobrazit"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={resetZoom}
            sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" } }}
          >
            {isMobile ? "Reset" : "Reset zoom"}
          </Button>
        </Box>
      </Box>

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {dateFilteredData.length > 0 && (
        <Box sx={{ mt: 1.5, pb: 0.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5, display: "block" }}
          >
            Posuň výběr pro přiblížení/oddálení časového úseku grafů.
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 36 : 40}>
            <LineChart data={dateFilteredData} syncId="deviceChartsSync">
              <XAxis dataKey="ts" hide />
              <Brush
                key={`temp-brush-${zoomResetKey}-${defaultBrushWindow.startIndex}-${defaultBrushWindow.endIndex}`}
                dataKey="ts"
                height={isMobile ? 28 : 32}
                travellerWidth={10}
                tickFormatter={formatAxisTime}
                startIndex={
                  brushWindow?.startIndex ?? defaultBrushWindow.startIndex
                }
                endIndex={brushWindow?.endIndex ?? defaultBrushWindow.endIndex}
                onChange={handleBrushChange}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      <Collapse in={expanded}>
        {dateFilteredData.length > 0 ? (
          <>
            <Card
              elevation={2}
              sx={{
                mt: 2,
                backgroundColor: "#f7efe7",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1}
                  sx={{ mb: 1 }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <DeviceThermostatIcon
                      fontSize="small"
                      sx={{ color: "#ff5a3c" }}
                    />
                    <Typography variant="subtitle1">Teplota (°C)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Aktuální teplota:{" "}
                    {latest?.temperature != null
                      ? `${latest.temperature} °C`
                      : "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limity:{" "}
                    {threshold?.temperature?.min != null ||
                    threshold?.temperature?.max != null
                      ? `${threshold?.temperature?.min ?? "—"}–${
                          threshold?.temperature?.max ?? "—"
                        } °C`
                      : "—"}
                  </Typography>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dateFilteredData}
                      syncId="deviceChartsSync"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        interval={tickInterval}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 8 : 8}
                        height={isMobile ? 30 : 50}
                      />
                      <YAxis
                        domain={[temperatureDomain.min, temperatureDomain.max]}
                        tickFormatter={(v) => `${Math.round(v)}°`}
                        axisLine={{ stroke: "#ff5722" }}
                        tickLine={{ stroke: "#ff5722" }}
                        width={isMobile ? 36 : 60}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Teplota (°C)",
                                angle: -90,
                                position: "insideLeft",
                              }
                        }
                      />
                      <Tooltip
                        labelFormatter={(v) => formatTime(new Date(v))}
                        formatter={(value, name) => {
                          if (name.includes("Teplota"))
                            return [`${value} °C`, name];
                          return [value, name];
                        }}
                      />
                      {!isMobile && <Legend />}

                      {threshold?.temperature?.min != null && (
                        <ReferenceArea
                          y1={temperatureDomain.min}
                          y2={threshold.temperature.min}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}
                      {threshold?.temperature?.min != null &&
                        threshold?.temperature?.max != null && (
                          <ReferenceArea
                            y1={threshold.temperature.min}
                            y2={threshold.temperature.max}
                            fill="#f8fbf7"
                            fillOpacity={0.35}
                            strokeOpacity={0}
                          />
                        )}
                      {threshold?.temperature?.max != null && (
                        <ReferenceArea
                          y1={threshold.temperature.max}
                          y2={temperatureDomain.max}
                          fill="#e5e5e5"
                          fillOpacity={0.55}
                          strokeOpacity={0}
                        />
                      )}

                      <Line
                        type="linear"
                        dataKey="temperature"
                        name="Teplota (°C)"
                        stroke="#ff5a3c"
                        dot={!isMobile}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={2}
              sx={{
                mt: 3,
                backgroundColor: "#eaf5f8",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1}
                  sx={{ mb: 1 }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <OpacityIcon fontSize="small" sx={{ color: "#1aa6c8" }} />
                    <Typography variant="subtitle1">Vlhkost (%)</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Aktuální vlhkost:{" "}
                    {latest?.humidity != null ? `${latest.humidity} %` : "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Limity:{" "}
                    {threshold?.humidity?.min != null ||
                    threshold?.humidity?.max != null
                      ? `${threshold?.humidity?.min ?? "—"}–${
                          threshold?.humidity?.max ?? "—"
                        } %`
                      : "—"}
                  </Typography>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dateFilteredData}
                      syncId="deviceChartsSync"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        interval={tickInterval}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 8 : 8}
                        height={isMobile ? 30 : 50}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={{ stroke: "#2196f3" }}
                        tickLine={{ stroke: "#2196f3" }}
                        width={isMobile ? 36 : 60}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Vlhkost (%)",
                                angle: -90,
                                position: "insideLeft",
                              }
                        }
                      />
                      <Tooltip
                        labelFormatter={(v) => formatTime(new Date(v))}
                        formatter={(value, name) => {
                          if (name.includes("Vlhkost"))
                            return [`${value} %`, name];
                          return [value, name];
                        }}
                      />
                      {!isMobile && <Legend />}

                      {threshold?.humidity?.min != null && (
                        <ReferenceArea
                          y1={0}
                          y2={threshold.humidity.min}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}
                      {threshold?.humidity?.min != null &&
                        threshold?.humidity?.max != null && (
                          <ReferenceArea
                            y1={threshold.humidity.min}
                            y2={threshold.humidity.max}
                            fill="#f8fbf7"
                            fillOpacity={0.35}
                            strokeOpacity={0}
                          />
                        )}
                      {threshold?.humidity?.max != null && (
                        <ReferenceArea
                          y1={threshold.humidity.max}
                          y2={100}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}

                      <Line
                        type="linear"
                        dataKey="humidity"
                        name="Vlhkost (%)"
                        stroke="#1aa6c8"
                        dot={!isMobile}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </>
        ) : (
          !loading && (
            <Typography sx={{ mt: 2 }}>
              Žádná data v tomto časovém rozsahu.
            </Typography>
          )
        )}
      </Collapse>
    </Box>
  );
}
