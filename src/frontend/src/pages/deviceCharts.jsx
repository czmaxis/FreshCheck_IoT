import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  ButtonGroup,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import dayjs from "dayjs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
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

export default function DeviceCharts({ deviceId }) {
  const { token } = useAuth();
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
          }))
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
              "Chyba při načítání dat"
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
  }, [deviceId, token]);

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
    const fromTs = fromDate
      ? new Date(fromDate).setHours(0, 0, 0, 0)
      : null;
    const toTs = toDate
      ? new Date(toDate).setHours(23, 59, 59, 999)
      : null;
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
    const fromTs = fromDate
      ? new Date(fromDate).setHours(0, 0, 0, 0)
      : null;
    const toTs = toDate
      ? new Date(toDate).setHours(23, 59, 59, 999)
      : null;
    return byRange.filter((t) => {
      if (fromTs != null && t < fromTs) return false;
      if (toTs != null && t > toTs) return false;
      return true;
    });
  }, [alertTimes, range, fromDate, toDate]);

  const toggle = () => setExpanded((v) => !v);

  // dynamic label interval based on density
  const tickInterval =
    dateFilteredData.length > 30 ? Math.ceil(dateFilteredData.length / 10) : 0;

  return (
    <Box p={3} mt={4}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5">Grafy (teplota / vlhkost)</Typography>

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <ButtonGroup size="small">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                variant={range === r.value ? "contained" : "outlined"}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </ButtonGroup>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <DateRangeSingleCalendar
              value={dateRange}
              onChange={setDateRange}
              label="Od–do"
              size="small"
            />
          </LocalizationProvider>

          <Button
            size="small"
            variant="outlined"
            onClick={toggle}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {expanded ? "Skrýt" : "Zobrazit"}
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
            {(threshold?.temperature?.min != null ||
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
              </Box>
            )}

            <Box sx={{ width: "100%", height: 300, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dateFilteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) => formatTime(new Date(v))}
                  interval={tickInterval}
                  tick={{ fontSize: 12 }}
                  height={50}
                />
                <YAxis
                  yAxisId="left"
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v}°`}
                  axisLine={{ stroke: "#ff5722" }}
                  tickLine={{ stroke: "#ff5722" }}
                  label={{
                    value: "🌡 Teplota (°C)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: "#2196f3" }}
                  tickLine={{ stroke: "#2196f3" }}
                  label={{
                    value: "💧 Vlhkost (%)",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  labelFormatter={(v) => formatTime(new Date(v))}
                  formatter={(value, name) => {
                    if (name.includes("Teplota")) return [`${value} °C`, name];
                    if (name.includes("Vlhkost")) return [`${value} %`, name];
                    return [value, name];
                  }}
                />
                <Legend />

                {threshold?.temperature?.max != null && (
                  <ReferenceLine
                    yAxisId="left"
                    y={threshold.temperature.max}
                    stroke="#ff8a65"
                    strokeDasharray="4 4"
                  />
                )}
                {threshold?.temperature?.min != null && (
                  <ReferenceLine
                    yAxisId="left"
                    y={threshold.temperature.min}
                    stroke="#ff8a65"
                    strokeDasharray="4 4"
                  />
                )}
                {threshold?.humidity?.max != null && (
                  <ReferenceLine
                    yAxisId="right"
                    y={threshold.humidity.max}
                    stroke="#64b5f6"
                    strokeDasharray="4 4"
                  />
                )}
                {threshold?.humidity?.min != null && (
                  <ReferenceLine
                    yAxisId="right"
                    y={threshold.humidity.min}
                    stroke="#64b5f6"
                    strokeDasharray="4 4"
                  />
                )}

                {filteredAlertTimes.map((t) => (
                  <ReferenceLine
                    key={`alert-${t}`}
                    x={t}
                    stroke="#ffb300"
                    strokeDasharray="2 6"
                    label={{
                      value: "⚠️",
                      position: "top",
                    }}
                  />
                ))}

                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey="temperature"
                  name="Teplota (°C)"
                  stroke="#ff5722"
                  dot={true}
                  connectNulls={true}
                />
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="humidity"
                  name="Vlhkost (%)"
                  stroke="#2196f3"
                  dot={true}
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
