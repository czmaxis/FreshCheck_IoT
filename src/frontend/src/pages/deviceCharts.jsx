import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
} from "@mui/material";
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
} from "recharts";
import { useAuth } from "../context/AuthContext.jsx";

function parseTimestamp(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function DeviceCharts({ deviceId }) {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    //později přesunout na service
    async function load() {
      setLoading(true);
      setError("");
      try {
        const url = `http://localhost:5001/sensordata/${encodeURIComponent(
          deviceId
        )}`;
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const resp = await axios.get(url, { headers });
        if (cancelled) return;

        // resp.data expected to be an array of sensor entries
        const arr = Array.isArray(resp.data) ? resp.data : [resp.data];

        // map to charts-friendly format: { time: 'HH:MM:SS', temperature: Number, humidity: Number }
        const chartData = arr.map((it) => ({
          time: parseTimestamp(it.timestamp),
          temperature: it.temperature != null ? Number(it.temperature) : null,
          humidity: it.humidity != null ? Number(it.humidity) : null,
        }));

        setData(chartData);
      } catch (err) {
        console.error("Chyba při načítání chart dat:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání dat"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [deviceId, token]);

  const toggle = () => setExpanded((v) => !v);

  return (
    <Box mt={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Grafy (teplota / vlhkost)</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={toggle}
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? "Skrýt graf" : "Zobrazit graf"}
        </Button>
      </Box>

      {loading && <CircularProgress />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {String(error)}
        </Typography>
      )}

      <Collapse in={expanded}>
        {data && data.length > 0 ? (
          <Box sx={{ width: "100%", height: 300, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Teplota (°C)"
                  stroke="#ff5722"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Vlhkost (%)"
                  stroke="#2196f3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          !loading && (
            <Typography sx={{ mt: 2 }}>
              Žádná data pro zvolené zařízení.
            </Typography>
          )
        )}
      </Collapse>
    </Box>
  );
}
