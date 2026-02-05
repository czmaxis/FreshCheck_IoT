import React, { useEffect, useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";

export default function DashboardSummary({ deviceId, token }) {
  const [summary, setSummary] = useState({
    latest: null,
    activeAlerts: 0,
    loading: false,
  });

  useEffect(() => {
    async function loadSummary() {
      if (!deviceId) {
        setSummary({ latest: null, activeAlerts: 0, loading: false });
        return;
      }

      try {
        setSummary((s) => ({ ...s, loading: true }));
        const [dataItems, activeAlerts] = await Promise.all([
          getSensorData(deviceId, token),
          getAlerts(deviceId, { active: true }, token),
        ]);

        const latest =
          Array.isArray(dataItems) && dataItems.length > 0 ? dataItems[0] : null;

        setSummary({
          latest,
          activeAlerts: Array.isArray(activeAlerts) ? activeAlerts.length : 0,
          loading: false,
        });
      } catch (err) {
        console.error("Chyba při načítání přehledu:", err);
        setSummary({ latest: null, activeAlerts: 0, loading: false });
      }
    }

    loadSummary();
  }, [deviceId, token]);

  const formatRelativeTime = (iso) => {
    if (!iso) return "-";
    const ts = new Date(iso);
    if (Number.isNaN(ts.getTime())) return "-";
    const diffMs = Date.now() - ts.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return "před chvílí";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `před ${diffMin} minutami`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `před ${diffHours} hodinami`;
    const diffDays = Math.floor(diffHours / 24);
    return `před ${diffDays} dny`;
  };

  return (
    <Box
      width="100%"
      maxWidth="900px"
      mt={2}
      mb={2}
      p={2}
      borderRadius={2}
      sx={{ backgroundColor: "#f7f7f7", border: "1px solid #e0e0e0" }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Přehled posledních dat
      </Typography>
      <Stack spacing={0.5}>
        <Typography>
          {summary.activeAlerts > 0 ? "🔴" : "🟢"} Stav zařízení:{" "}
          {summary.activeAlerts > 0 ? "Pozor" : "OK"}
        </Typography>
        <Typography>🔴 Aktivní výstrahy: {summary.activeAlerts}</Typography>
        <Typography>
          🌡 Poslední teplota: {summary.latest?.temperature ?? "-"} °C
        </Typography>
        <Typography>
          💧 Poslední vlhkost: {summary.latest?.humidity ?? "-"} %
        </Typography>
        <Typography>
          🕒 Poslední data:{" "}
          {summary.latest?.timestamp
            ? formatRelativeTime(summary.latest.timestamp)
            : "-"}
        </Typography>
        {summary.loading && (
          <Typography variant="body2" color="text.secondary">
            Načítám přehled…
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
