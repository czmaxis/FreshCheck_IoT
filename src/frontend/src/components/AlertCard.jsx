import React from "react";
import { Box, Typography, Chip } from "@mui/material";

function getTypeLabel(alert) {
  switch (alert.type) {
    case "humidity":
      return "Vlhkost";
    case "temperature":
      return "Teplota";
    case "door":
      return "Dveře";
    case "doorOpen":
      return "Otevřené dveře";
    default:
      return alert.type || "Výstraha";
  }
}

function getTitle(alert, deviceThreshold) {
  const value = alert.value;
  const min =
    alert.threshold?.[alert.type]?.min ??
    alert.threshold?.min ??
    deviceThreshold?.[alert.type]?.min ??
    deviceThreshold?.min ??
    null;
  const max =
    alert.threshold?.[alert.type]?.max ??
    alert.threshold?.max ??
    deviceThreshold?.[alert.type]?.max ??
    deviceThreshold?.max ??
    null;

  if (alert.type === "humidity") {
    if (min != null && value < min) return "Nízká vlhkost";
    if (max != null && value > max) return "Vysoká vlhkost";
    return "Výstraha vlhkosti";
  }

  if (alert.type === "temperature") {
    if (min != null && value < min) return "Nízká teplota";
    if (max != null && value > max) return "Vysoká teplota";
    return "Výstraha teploty";
  }

  if (alert.type === "door" || alert.type === "doorOpen") {
    return "Dveře otevřeny";
  }

  return "Výstraha";
}

function formatValue(alert, deviceThreshold) {
  if (alert.type === "humidity") {
    const min =
      alert.threshold?.humidity?.min ??
      alert.threshold?.min ??
      deviceThreshold?.humidity?.min ??
      deviceThreshold?.min ??
      null;
    const max =
      alert.threshold?.humidity?.max ??
      alert.threshold?.max ??
      deviceThreshold?.humidity?.max ??
      deviceThreshold?.max ??
      null;
    const limitText =
      min != null && max != null
        ? ` (limit ${min}–${max} %)`
        : min != null
          ? ` (limit ${min} %)`
          : max != null
            ? ` (limit ${max} %)`
            : "";
    return `💧 ${alert.value ?? "-"} %${limitText}`;
  }
  if (alert.type === "temperature") {
    const min =
      alert.threshold?.temperature?.min ??
      alert.threshold?.min ??
      deviceThreshold?.temperature?.min ??
      deviceThreshold?.min ??
      null;
    const max =
      alert.threshold?.temperature?.max ??
      alert.threshold?.max ??
      deviceThreshold?.temperature?.max ??
      deviceThreshold?.max ??
      null;
    const limitText =
      min != null && max != null
        ? ` (limit ${min}–${max} °C)`
        : min != null
          ? ` (limit ${min} °C)`
          : max != null
            ? ` (limit ${max} °C)`
            : "";
    return `🌡 ${alert.value ?? "-"} °C${limitText}`;
  }
  if (alert.type === "door" || alert.type === "doorOpen") {
    const limit =
      alert.threshold?.doorOpenMaxSeconds ??
      alert.threshold?.doorOpen?.max ??
      deviceThreshold?.doorOpenMaxSeconds ??
      deviceThreshold?.doorOpen?.max ??
      null;
    const limitText = limit != null ? ` (limit ${limit} s)` : "";
    return `🚪 ${alert.value ?? "-"} s${limitText}`;
  }
  return `${alert.value ?? "-"}`;
}

export default function AlertCard({ alert, deviceThreshold = null, actions }) {
  const isActive = Boolean(alert.active);

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: isActive ? "1px solid #f2c2a2" : "1px solid #e0e0e0",
        backgroundColor: isActive ? "#fff7f0" : "#f7f7f7",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          ⚠️ {getTitle(alert, deviceThreshold)}
        </Typography>

        {!isActive && (
          <Chip
            size="small"
            label="Vyřešená"
            sx={{
              backgroundColor: "#e0e0e0",
              color: "#424242",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <Typography sx={{ mb: 0.5 }}>
        {formatValue(alert, deviceThreshold)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        🕒 {new Date(alert.timestamp).toLocaleString("cs-CZ")}
      </Typography>

      {actions ? (
        <Box display="flex" gap={1.5} mt={1.5}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
