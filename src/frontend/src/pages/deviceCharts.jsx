import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  Card,
  CardContent,
  Slider,
  Chip,
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
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [zoomRange, setZoomRange] = useState(null);

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

  const dataBounds = useMemo(() => {
    const len = dateFilteredData.length;
    if (!len) return null;
    return { minTs: dateFilteredData[0].ts, maxTs: dateFilteredData[len - 1].ts };
  }, [dateFilteredData]);

  useEffect(() => {
    // Changing the displayed time range/date filter should reset zoom.
    setZoomRange(null);
  }, [deviceId, range, fromDate, toDate]);

  useEffect(() => {
    if (!zoomRange || !dataBounds) return;

    let [startTs, endTs] = zoomRange;
    if (!Number.isFinite(startTs) || !Number.isFinite(endTs)) {
      setZoomRange(null);
      return;
    }

    if (startTs > endTs) [startTs, endTs] = [endTs, startTs];
    const minTs = dataBounds.minTs;
    const maxTs = dataBounds.maxTs;
    const spanMs = Math.max(0, endTs - startTs);

    if (startTs < minTs) {
      startTs = minTs;
      endTs = Math.min(minTs + spanMs, maxTs);
    }
    if (endTs > maxTs) {
      endTs = maxTs;
      startTs = Math.max(maxTs - spanMs, minTs);
    }

    startTs = Math.max(startTs, minTs);
    endTs = Math.min(endTs, maxTs);

    if (startTs !== zoomRange[0] || endTs !== zoomRange[1]) {
      setZoomRange([startTs, endTs]);
    }
  }, [zoomRange, dataBounds]);

  const chartData = useMemo(() => {
    if (!zoomRange) return dateFilteredData;
    const start = Math.min(zoomRange[0], zoomRange[1]);
    const end = Math.max(zoomRange[0], zoomRange[1]);
    return dateFilteredData.filter((d) => d.ts >= start && d.ts <= end);
  }, [dateFilteredData, zoomRange]);

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

  const visibleData = chartData;

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

  const timeSpanMs = useMemo(() => {
    if (chartData.length === 0) return 0;
    const minTs = chartData[0].ts;
    const maxTs = chartData[chartData.length - 1].ts;
    return Math.max(0, maxTs - minTs);
  }, [chartData]);

  // Adaptive tick count based on time span for better visibility
  const getTickCount = () => {
    if (chartData.length === 0) return 5;

    // Pro mobilní zařízení méně ticků
    if (isMobile) return 6;

    // Pro desktop - adaptivní počet podle časového rozsahu
    const hours = timeSpanMs / (60 * 60 * 1000);

    if (hours <= 2) return 12; // 2 hodiny nebo méně: 12 značek
    if (hours <= 6) return 15; // 6 hodin: 15 značek
    if (hours <= 24) return 18; // 24 hodin: 18 značek
    if (hours <= 168) return 20; // 7 dní: 20 značek
    return 25; // delší období: 25 značek
  };

  const tickCount = getTickCount();

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
  const resetZoom = () => {
    setZoomRange(null);
  };

  const sliderSpanMs = useMemo(() => {
    if (!dataBounds) return 0;
    return Math.max(0, dataBounds.maxTs - dataBounds.minTs);
  }, [dataBounds]);

  const formatSliderTime = (v) => {
    if (!Number.isFinite(v)) return "-";
    const d = new Date(v);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    if (sliderSpanMs >= 24 * 60 * 60 * 1000) {
      return `${day}.${month} ${hours}:${minutes}`;
    }
    return `${hours}:${minutes}`;
  };

  return (
    <Box
      p={{ xs: 2, sm: 3 }}
      mt={{ xs: 2, sm: 4 }}
      borderRadius={3}
      sx={{
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "background.paper",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ef5350 0%, #42a5f5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.9,
            }}
          >
            <DeviceThermostatIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Grafy (teplota / vlhkost)
          </Typography>
        </Box>

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
            selectedValue={range}
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
            variant="contained"
            onClick={resetZoom}
            sx={{
              width: { xs: "calc(50% - 4px)", sm: "auto" },
              textTransform: "none",
            }}
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

      <Collapse in={expanded}>
        {dateFilteredData.length > 0 && dataBounds && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f5f5f5",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ mb: 1.5 }}
            >
              📊 Posuň výběr pro přiblížení/oddálení časového úseku grafů
            </Typography>

            <Slider
              value={zoomRange ?? [dataBounds.minTs, dataBounds.maxTs]}
              min={dataBounds.minTs}
              max={dataBounds.maxTs}
              step={60 * 1000}
              disableSwap
              valueLabelDisplay="auto"
              valueLabelFormat={formatSliderTime}
              onChange={(_, value) => {
                if (!Array.isArray(value) || value.length !== 2) return;
                const start = Math.min(value[0], value[1]);
                const end = Math.max(value[0], value[1]);
                setZoomRange([start, end]);
              }}
              disabled={dataBounds.minTs === dataBounds.maxTs}
              sx={{
                px: 1,
                mt: 0.5,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                },
              }}
            />

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1 }}
            >
              <Chip
                label={`Od: ${formatSliderTime((zoomRange ?? [dataBounds.minTs, dataBounds.maxTs])[0])}`}
                size="small"
                sx={{
                  backgroundColor: "white",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
              <Chip
                label={`Do: ${formatSliderTime((zoomRange ?? [dataBounds.minTs, dataBounds.maxTs])[1])}`}
                size="small"
                sx={{
                  backgroundColor: "white",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          </Box>
        )}

        {dateFilteredData.length > 0 ? (
          <>
            <Card
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 3,
                borderLeft: "4px solid #ef5350",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1.5}
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#ef535015",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DeviceThermostatIcon
                        fontSize="small"
                        sx={{ color: "#ef5350" }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Teplota (°C)
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<DeviceThermostatIcon />}
                      label={
                        latest?.temperature != null
                          ? `${latest.temperature} °C`
                          : "-"
                      }
                      sx={{
                        backgroundColor: "#ef535015",
                        border: "1px solid #ef535030",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#ef5350" },
                        "& .MuiChip-label": { color: "#ef5350" },
                      }}
                    />
                    <Chip
                      label={
                        threshold?.temperature?.min != null ||
                        threshold?.temperature?.max != null
                          ? `Limity: ${threshold?.temperature?.min ?? "—"}–${
                              threshold?.temperature?.max ?? "—"
                            } °C`
                          : "Limity: —"
                      }
                      size="small"
                      sx={{
                        backgroundColor: "#9e9e9e15",
                        fontWeight: 500,
                        "& .MuiChip-label": { color: "#9e9e9e" },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="deviceChartsSync">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        tickCount={tickCount}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 20 : 30}
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
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 3,
                borderLeft: "4px solid #42a5f5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1.5}
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#42a5f515",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <OpacityIcon fontSize="small" sx={{ color: "#42a5f5" }} />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Vlhkost (%)
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<OpacityIcon />}
                      label={
                        latest?.humidity != null ? `${latest.humidity} %` : "-"
                      }
                      sx={{
                        backgroundColor: "#42a5f515",
                        border: "1px solid #42a5f530",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#42a5f5" },
                        "& .MuiChip-label": { color: "#42a5f5" },
                      }}
                    />
                    <Chip
                      label={
                        threshold?.humidity?.min != null ||
                        threshold?.humidity?.max != null
                          ? `Limity: ${threshold?.humidity?.min ?? "—"}–${
                              threshold?.humidity?.max ?? "—"
                            } %`
                          : "Limity: —"
                      }
                      size="small"
                      sx={{
                        backgroundColor: "#9e9e9e15",
                        fontWeight: 500,
                        "& .MuiChip-label": { color: "#9e9e9e" },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="deviceChartsSync">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        tickCount={tickCount}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 20 : 30}
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
