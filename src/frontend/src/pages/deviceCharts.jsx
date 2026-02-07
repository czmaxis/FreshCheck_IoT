import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import dayjs from "dayjs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import LimitsSkeleton from "../components/LimitsSkeleton.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";

const RANGES = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "Vše", value: "all" },
];
function parseTimestamp(ts) {
  const d = new Date(ts);
  d.setHours(d.getHours() + 1); // +1 hour to temporarily fix timezone issue in CZ
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

  const sorted = [...rawData].sort((a, b) => a.ts - b.ts);
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

  const toggle = () => setExpanded((v) => !v);

  // dynamic label interval based on density
  const tickInterval =
    dateFilteredData.length > (isMobile ? 10 : 30)
      ? Math.ceil(dateFilteredData.length / (isMobile ? 4 : 10))
      : 0;

  const formatAxisTime = (v) => {
    const d = new Date(v);
    if (isMobile) {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return formatTime(d);
  };
  const defaultBrushWindow = useMemo(() => {
    const len = dateFilteredData.length;
    if (len === 0) return { startIndex: 0, endIndex: 0 };
    if (range === "all" && len > 120) {
      return { startIndex: len - 120, endIndex: len - 1 };
    }
    return { startIndex: 0, endIndex: len - 1 };
  }, [dateFilteredData.length, range]);

  const resetZoom = () => {
    setZoomResetKey((k) => k + 1);
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
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {RANGES.map((r) => (
              <Button
                key={r.value}
                size="small"
                variant={range === r.value ? "contained" : "outlined"}
                onClick={() => setRange(r.value)}
                sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
              >
                {r.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
              <DateRangeSingleCalendar
                value={dateRange}
                onChange={setDateRange}
                label="Od–do"
                size="small"
                fullWidth={isMobile}
              />
            </LocalizationProvider>
          </Box>

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

      <Collapse in={expanded}>
        {dateFilteredData.length > 0 ? (
          <>
            {(limitsLoading ||
              threshold?.temperature?.min != null ||
              threshold?.temperature?.max != null ||
              threshold?.humidity?.min != null ||
              threshold?.humidity?.max != null) && (
              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Limity
                </Typography>
                {limitsLoading ? (
                  <LimitsSkeleton lines={2} />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    {threshold?.temperature?.min != null && (
                      <Typography variant="body2">
                        🌡 Min teplota: {threshold.temperature.min} °C
                      </Typography>
                    )}
                    {threshold?.temperature?.max != null && (
                      <Typography variant="body2">
                        🌡 Max teplota: {threshold.temperature.max} °C
                      </Typography>
                    )}
                    {threshold?.humidity?.min != null && (
                      <Typography variant="body2">
                        💧 Min vlhkost: {threshold.humidity.min} %
                      </Typography>
                    )}
                    {threshold?.humidity?.max != null && (
                      <Typography variant="body2">
                        💧 Max vlhkost: {threshold.humidity.max} %
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ width: "100%", height: isMobile ? 260 : 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dateFilteredData} syncId="deviceChartsSync">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    padding={{ left: 8, right: 16 }}
                    tickFormatter={formatAxisTime}
                    interval={tickInterval}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    minTickGap={isMobile ? 20 : 8}
                    height={isMobile ? 30 : 50}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `${v}°`}
                    axisLine={{ stroke: "#ff5722" }}
                    tickLine={{ stroke: "#ff5722" }}
                    width={isMobile ? 36 : 60}
                    label={
                      isMobile
                        ? undefined
                        : {
                            value: "🌡 Teplota (°C)",
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

                  {threshold?.temperature?.max != null && (
                    <ReferenceLine
                      y={threshold.temperature.max}
                      stroke="#ff8a65"
                      strokeDasharray="4 4"
                    />
                  )}
                  {threshold?.temperature?.min != null && (
                    <ReferenceLine
                      y={threshold.temperature.min}
                      stroke="#ff8a65"
                      strokeDasharray="4 4"
                    />
                  )}

                  {filteredAlertTimes.map((t) => (
                    <ReferenceLine
                      key={`temperature-alert-${t}`}
                      x={t}
                      stroke="#ffb300"
                      strokeDasharray="2 6"
                    />
                  ))}

                  <Line
                    type="linear"
                    dataKey="temperature"
                    name="Teplota (°C)"
                    stroke="#ff5722"
                    dot={!isMobile}
                    connectNulls={true}
                  />
                  <Brush
                    key={`temp-brush-${zoomResetKey}-${defaultBrushWindow.startIndex}-${defaultBrushWindow.endIndex}`}
                    dataKey="ts"
                    height={isMobile ? 24 : 28}
                    travellerWidth={10}
                    tickFormatter={formatAxisTime}
                    startIndex={defaultBrushWindow.startIndex}
                    endIndex={defaultBrushWindow.endIndex}
                  />
                  </LineChart>
                </ResponsiveContainer>
            </Box>

            <Box sx={{ width: "100%", height: isMobile ? 260 : 300, mt: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dateFilteredData} syncId="deviceChartsSync">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    padding={{ left: 8, right: 16 }}
                    tickFormatter={formatAxisTime}
                    interval={tickInterval}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    minTickGap={isMobile ? 20 : 8}
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
                            value: "💧 Vlhkost (%)",
                            angle: -90,
                            position: "insideLeft",
                          }
                    }
                  />
                  <Tooltip
                    labelFormatter={(v) => formatTime(new Date(v))}
                    formatter={(value, name) => {
                      if (name.includes("Vlhkost")) return [`${value} %`, name];
                      return [value, name];
                    }}
                  />
                  {!isMobile && <Legend />}

                  {threshold?.humidity?.max != null && (
                    <ReferenceLine
                      y={threshold.humidity.max}
                      stroke="#64b5f6"
                      strokeDasharray="4 4"
                    />
                  )}
                  {threshold?.humidity?.min != null && (
                    <ReferenceLine
                      y={threshold.humidity.min}
                      stroke="#64b5f6"
                      strokeDasharray="4 4"
                    />
                  )}

                  {filteredAlertTimes.map((t) => (
                    <ReferenceLine
                      key={`humidity-alert-${t}`}
                      x={t}
                      stroke="#64b5f6"
                      strokeDasharray="2 6"
                    />
                  ))}

                  <Line
                    type="linear"
                    dataKey="humidity"
                    name="Vlhkost (%)"
                    stroke="#2196f3"
                    dot={!isMobile}
                    connectNulls={true}
                  />
                  </LineChart>
                </ResponsiveContainer>
            </Box>
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
