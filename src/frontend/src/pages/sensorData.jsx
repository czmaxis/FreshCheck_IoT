import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Stack, Chip } from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

export default function SensorData({ deviceId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const resp = await getSensorData(deviceId, token);
        if (!cancelled) setData(resp);
      } catch (err) {
        console.error("Chyba při načítání sensor dat:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání sensor dat."
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

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Sensor data
      </Typography>

      {loading && <CircularProgress />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {String(error)}
        </Typography>
      )}

      {data && Array.isArray(data) ? (
        data.map((item) => (
          <Box
            key={item._id}
            sx={{
              mb: 2,
              p: 2,
              border: "1px solid #eee",
              borderRadius: 1,
              backgroundColor: "background.paper",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography>
                <strong>Čas:</strong> {formatTimestamp(item.timestamp)}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<DeviceThermostatIcon />}
                  label={`${item.temperature}${
                    item.temperature !== undefined ? " °C" : ""
                  }`}
                  variant="outlined"
                />

                <Chip
                  icon={<OpacityIcon />}
                  label={`${item.humidity}${
                    item.humidity !== undefined ? " %" : ""
                  }`}
                  variant="outlined"
                />
              </Stack>
            </Stack>
          </Box>
        ))
      ) : data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : null}
    </Box>
  );
}
