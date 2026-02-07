import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import LimitsSkeleton from "./LimitsSkeleton.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";

const RANGES = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "Včera", value: "yesterday" },
  { label: "Tento týden", value: "thisWeek" },
  { label: "Vše", value: "all" },
];

export default function DashboardSummary({
  deviceId,
  token,
  onOpenLimits,
  refreshKey,
  limitsLoading,
}) {
  const [summary, setSummary] = useState({
    latest: null,
    activeAlerts: 0,
    loading: false,
  });
  const [deviceThreshold, setDeviceThreshold] = useState(null);
  const [dataItems, setDataItems] = useState([]);
  const [range, setRange] = useState("24h");

  useEffect(() => {
    async function loadSummary() {
      if (!deviceId) {
        setSummary({ latest: null, activeAlerts: 0, loading: false });
        setDataItems([]);
        return;
      }

      try {
        setSummary((s) => ({ ...s, loading: true }));
        const [data, activeAlerts, device] = await Promise.all([
          getSensorData(deviceId, token),
          getAlerts(deviceId, { active: true }, token),
          getDevice(deviceId, token),
        ]);

        const items = Array.isArray(data) ? data : [data];
        const latest = items.length > 0 ? items[0] : null;

        setDataItems(items);
        setDeviceThreshold(device?.threshold ?? null);
        setSummary({
          latest,
          activeAlerts: Array.isArray(activeAlerts) ? activeAlerts.length : 0,
          loading: false,
        });
      } catch (err) {
        console.error("Chyba při načítání přehledu:", err);
        setSummary({ latest: null, activeAlerts: 0, loading: false });
        setDataItems([]);
        setDeviceThreshold(null);
      }
    }

    loadSummary();
  }, [deviceId, token, refreshKey]);

  const limitsText = useMemo(() => {
    if (!deviceThreshold) return "-";

    const parts = [];
    const tMin = deviceThreshold?.temperature?.min;
    const tMax = deviceThreshold?.temperature?.max;
    if (tMin != null || tMax != null) {
      const tText =
        tMin != null && tMax != null
          ? `${tMin}–${tMax} °C`
          : tMin != null
            ? `≥ ${tMin} °C`
            : `≤ ${tMax} °C`;
      parts.push(`Teplota ${tText}`);
    }

    const hMin = deviceThreshold?.humidity?.min;
    const hMax = deviceThreshold?.humidity?.max;
    if (hMin != null || hMax != null) {
      const hText =
        hMin != null && hMax != null
          ? `${hMin}–${hMax} %`
          : hMin != null
            ? `≥ ${hMin} %`
            : `≤ ${hMax} %`;
      parts.push(`Vlhkost ${hText}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "-";
  }, [deviceThreshold]);

  const filteredData = useMemo(() => {
    if (!dataItems || dataItems.length === 0) return [];
    if (range === "all") return dataItems;

    const now = new Date();
    let from = null;
    let to = null;

    if (range === "1h") {
      from = new Date(now.getTime() - 60 * 60 * 1000);
      to = now;
    } else if (range === "6h") {
      from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      to = now;
    } else if (range === "24h") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      to = now;
    } else if (range === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (range === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      to = new Date(
        y.getFullYear(),
        y.getMonth(),
        y.getDate(),
        23,
        59,
        59,
        999,
      );
    } else if (range === "thisWeek") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - (day - 1));
      from = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0,
      );
      to = now;
    }

    const fromTs = from ? from.getTime() : null;
    const toTs = to ? to.getTime() : null;

    return dataItems.filter((d) => {
      const ts = d.timestamp ? new Date(d.timestamp).getTime() : null;
      if (!ts) return false;
      if (fromTs != null && ts < fromTs) return false;
      if (toTs != null && ts > toTs) return false;
      return true;
    });
  }, [dataItems, range]);

  const averages = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgTemp: null, avgHumidity: null, doorOpenings: 0 };
    }

    let tempSum = 0;
    let tempCount = 0;
    let humSum = 0;
    let humCount = 0;
    let doorOpenings = 0;

    for (const item of filteredData) {
      if (item.temperature != null && !Number.isNaN(Number(item.temperature))) {
        tempSum += Number(item.temperature);
        tempCount += 1;
      }
      if (item.humidity != null && !Number.isNaN(Number(item.humidity))) {
        humSum += Number(item.humidity);
        humCount += 1;
      }

      const doorIsOpen =
        item.doors === true ||
        item.doors === 1 ||
        (item.illuminance != null && Number(item.illuminance) > 0);
      if (doorIsOpen) doorOpenings += 1;
    }

    return {
      avgTemp: tempCount > 0 ? tempSum / tempCount : null,
      avgHumidity: humCount > 0 ? humSum / humCount : null,
      doorOpenings,
    };
  }, [filteredData]);

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

  const renderRow = (icon, text) => (
    <Box display="flex" alignItems="center" gap={1}>
      {icon}
      <Typography>{text}</Typography>
    </Box>
  );

  const statusIcon =
    summary.activeAlerts > 0 ? (
      <WarningAmberIcon fontSize="small" color="warning" />
    ) : (
      <CheckCircleIcon fontSize="small" color="success" />
    );

  return (
    <Box
      width="100%"
      maxWidth="900px"
      mt={2}
      mb={2}
      p={{ xs: 1.5, sm: 2 }}
      borderRadius={2}
      sx={{
        backgroundColor: "#f7f7f7",
        border: "1px solid #e0e0e0",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Box
        display="flex"
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={{ xs: 1, sm: 0 }}
      >
        <Typography variant="subtitle1">Přehled posledních dat</Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="body2">Průměry za</Typography>
          <TextField
            select
            size="small"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            sx={{ minWidth: 90, width: { xs: "100%", sm: 90 } }}
          >
            {RANGES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 1 }}>
        <Stack spacing={0.75} sx={{ minWidth: { xs: 0, sm: 260 }, flex: 1 }}>
          {renderRow(
            statusIcon,
            `Stav zařízení: ${summary.activeAlerts > 0 ? "Pozor" : "OK"}`,
          )}
          {renderRow(statusIcon, `Aktivní výstrahy: ${summary.activeAlerts}`)}
          {renderRow(
            <ThermostatIcon fontSize="small" color="error" />,
            `Aktuální teplota: ${summary.latest?.temperature ?? "-"} °C`,
          )}
          {renderRow(
            <OpacityIcon fontSize="small" color="info" />,
            `Aktuální vlhkost: ${summary.latest?.humidity ?? "-"} %`,
          )}
          {renderRow(
            <AccessTimeIcon fontSize="small" color="action" />,
            `Poslední data: ${summary.latest?.timestamp ? formatRelativeTime(summary.latest.timestamp) : "-"}`,
          )}
        </Stack>

        <Stack spacing={0.75} sx={{ minWidth: { xs: 0, sm: 260 }, flex: 1 }}>
          <Typography variant="subtitle2">Průměry</Typography>
          {renderRow(
            <EqualizerIcon fontSize="small" color="action" />,
            `Průměrná teplota: ${averages.avgTemp != null ? `${averages.avgTemp.toFixed(1)} °C` : "-"}`,
          )}
          {renderRow(
            <EqualizerIcon fontSize="small" color="action" />,
            `Průměrná vlhkost: ${averages.avgHumidity != null ? `${averages.avgHumidity.toFixed(1)} %` : "-"}`,
          )}
          {renderRow(
            <DoorFrontIcon fontSize="small" color="action" />,
            `Počet otevření dveří: ${averages.doorOpenings}`,
          )}
        </Stack>
      </Box>

      {summary.loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Načítám přehled…
        </Typography>
      )}

      <Box
        sx={{
          mt: 1.5,
          pt: 1,
          borderTop: "1px dashed #ddd",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        {limitsLoading ? (
          <LimitsSkeleton lines={1} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Limity: {limitsText}
          </Typography>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenLimits}
          disabled={!deviceId}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Nastavit limity
        </Button>
      </Box>
    </Box>
  );
}
