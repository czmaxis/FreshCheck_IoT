import { useMemo, useState } from "react";
import { filterByQuickRange } from "../utils/dateRangeUtils.js";
import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import LimitsSkeleton from "./LimitsSkeleton.jsx";

const RANGES = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "Včera", value: "yesterday" },
  { label: "Tento týden", value: "thisWeek" },
  { label: "Vše", value: "all" },
];

export default function DashboardSummary({
  sensorData,
  activeAlerts,
  device,
  loading,
  deviceId,
  onOpenLimits,
  limitsLoading,
}) {
  const [range, setRange] = useState("24h");

  const dataItems = useMemo(
    () => (Array.isArray(sensorData) ? sensorData : []),
    [sensorData],
  );

  const alertCount = Array.isArray(activeAlerts) ? activeAlerts.length : 0;
  const latest = dataItems.length > 0 ? dataItems[0] : null;
  const deviceThreshold = device?.threshold ?? null;

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

  const filteredData = useMemo(
    () => filterByQuickRange(dataItems, range),
    [dataItems, range],
  );

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

  const statusColor = alertCount > 0 ? "#ff9800" : "#66bb6a";
  const statusIcon =
    alertCount > 0 ? (
      <WarningAmberIcon fontSize="small" sx={{ color: statusColor }} />
    ) : (
      <CheckCircleIcon fontSize="small" sx={{ color: statusColor }} />
    );

  return (
    <Box
      width="100%"
      maxWidth="900px"
      mt={2}
      mb={2}
      p={{ xs: 2, sm: 3 }}
      borderRadius={3}
      sx={{
        backgroundColor: "background.paper",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        overflowX: "hidden",
        boxSizing: "border-box",
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
        gap={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: `${statusColor}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {statusIcon}
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Přehled posledních dat
          </Typography>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="body2" color="text.secondary">
            Průměry za
          </Typography>
          <TextField
            select
            size="small"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            sx={{ minWidth: 100, width: { xs: "100%", sm: 100 } }}
          >
            {RANGES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Status a Aktuální hodnoty */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          Stav zařízení
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1.5 }}>
          <Chip
            icon={statusIcon}
            label={`${alertCount > 0 ? "Pozor" : "OK"}`}
            sx={{
              backgroundColor: `${statusColor}15`,
              border: `1px solid ${statusColor}30`,
              fontWeight: 600,
              "& .MuiChip-icon": { color: statusColor },
              "& .MuiChip-label": { color: statusColor },
            }}
          />
          <Chip
            icon={<WarningAmberIcon />}
            label={`${alertCount} aktivních výstrah`}
            sx={{
              backgroundColor: alertCount > 0 ? "#ff980015" : "#9e9e9e15",
              border: alertCount > 0 ? "1px solid #ff980030" : "1px solid #9e9e9e30",
              fontWeight: 600,
              "& .MuiChip-icon": { color: alertCount > 0 ? "#ff9800" : "#9e9e9e" },
              "& .MuiChip-label": { color: alertCount > 0 ? "#ff9800" : "#9e9e9e" },
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          Aktuální hodnoty
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1.5 }}>
          <Chip
            icon={<ThermostatIcon />}
            label={`${latest?.temperature ?? "-"} °C`}
            sx={{
              backgroundColor: "#ef535015",
              border: "1px solid #ef535030",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#ef5350" },
              "& .MuiChip-label": { color: "#ef5350" },
            }}
          />
          <Chip
            icon={<OpacityIcon />}
            label={`${latest?.humidity ?? "-"} %`}
            sx={{
              backgroundColor: "#42a5f515",
              border: "1px solid #42a5f530",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#42a5f5" },
              "& .MuiChip-label": { color: "#42a5f5" },
            }}
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={latest?.timestamp ? formatRelativeTime(latest.timestamp) : "-"}
            size="small"
            sx={{
              backgroundColor: "#9e9e9e15",
              border: "1px solid #9e9e9e30",
              "& .MuiChip-icon": { color: "#9e9e9e" },
              "& .MuiChip-label": { color: "#9e9e9e" },
            }}
          />
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Průměry */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ mb: 1.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          Průměrné hodnoty
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1.5 }}>
          <Chip
            icon={<EqualizerIcon />}
            label={`Teplota: ${averages.avgTemp != null ? `${averages.avgTemp.toFixed(1)} °C` : "-"}`}
            sx={{
              backgroundColor: "#ef535015",
              border: "1px solid #ef535030",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#ef5350" },
              "& .MuiChip-label": { color: "#ef5350" },
            }}
          />
          <Chip
            icon={<EqualizerIcon />}
            label={`Vlhkost: ${averages.avgHumidity != null ? `${averages.avgHumidity.toFixed(1)} %` : "-"}`}
            sx={{
              backgroundColor: "#42a5f515",
              border: "1px solid #42a5f530",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#42a5f5" },
              "& .MuiChip-label": { color: "#42a5f5" },
            }}
          />
          <Chip
            icon={<DoorFrontIcon />}
            label={`Dveře: ${averages.doorOpenings}×`}
            sx={{
              backgroundColor: "#ff980015",
              border: "1px solid #ff980030",
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#ff9800" },
              "& .MuiChip-label": { color: "#ff9800" },
            }}
          />
        </Stack>
      </Box>

      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Načítám přehled…
        </Typography>
      )}

      {/* Limity */}
      <Divider sx={{ my: 2 }} />
      <Box
        sx={{
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
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Limity:
            </Typography>
            <Typography variant="body2" color="text.primary">
              {limitsText}
            </Typography>
          </Box>
        )}
        <Button
          variant="contained"
          onClick={onOpenLimits}
          disabled={!deviceId}
          sx={{
            width: { xs: "100%", sm: "auto" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Nastavit limity
        </Button>
      </Box>
    </Box>
  );
}
