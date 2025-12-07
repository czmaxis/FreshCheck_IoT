import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";

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
        Sensor data pro device: {deviceId}
      </Typography>

      {loading && <CircularProgress />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {String(error)}
        </Typography>
      )}

      {data && Array.isArray(data) ? (
        data.map((item) => (
          <Box key={item._id} sx={{ mb: 2, p: 2, border: "1px solid #eee" }}>
            <Typography>
              <strong>Timestamp:</strong> {item.timestamp}
            </Typography>
            <Typography>
              <strong>Temperature:</strong> {item.temperature}
            </Typography>
            <Typography>
              <strong>Humidity:</strong> {item.humidity}
            </Typography>
          </Box>
        ))
      ) : data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : null}
    </Box>
  );
}
