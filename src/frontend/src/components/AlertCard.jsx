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

function getTitle(alert) {
  const value = alert.value;
  const min =
    alert.alertTreshold?.[alert.type]?.min ??
    alert.alertTreshold?.min ??
    alert.threshold?.[alert.type]?.min ??
    alert.threshold?.min ??
    null;
  const max =
    alert.alertTreshold?.[alert.type]?.max ??
    alert.alertTreshold?.max ??
    alert.threshold?.[alert.type]?.max ??
    alert.threshold?.max ??
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

function formatValue(alert) {
  if (alert.type === "humidity") {
    return `💧 ${alert.value ?? "-"} %`;
  }
  if (alert.type === "temperature") {
    return `🌡 ${alert.value ?? "-"} °C`;
  }
  if (alert.type === "door" || alert.type === "doorOpen") {
    return `🚪 ${alert.value ?? "-"} s`;
  }
  return `${alert.value ?? "-"}`;
}

function formatAlertTreshold(alert) {
  const t = alert.alertTreshold ?? alert.threshold ?? null;
  if (!t) return null;

  if (alert.type === "temperature") {
    const min = t?.temperature?.min;
    const max = t?.temperature?.max;
    if (min == null && max == null) return null;
    if (min != null && max != null) return `Limit teploty ${min}–${max} °C`;
    if (min != null) return `Limit teploty ≥ ${min} °C`;
    return `Limit teploty ≤ ${max} °C`;
  }

  if (alert.type === "humidity") {
    const min = t?.humidity?.min;
    const max = t?.humidity?.max;
    if (min == null && max == null) return null;
    if (min != null && max != null) return `Limit vlhkosti ${min}–${max} %`;
    if (min != null) return `Limit vlhkosti ≥ ${min} %`;
    return `Limit vlhkosti ≤ ${max} %`;
  }

  if (alert.type === "door" || alert.type === "doorOpen") {
    const doorLimit = t?.doorOpenMaxSeconds ?? t?.doorOpen?.max ?? null;
    if (doorLimit == null) return null;
    return `Limit dveří max ${doorLimit} s`;
  }

  return null;
}

export default function AlertCard({ alert, actions }) {
  const isActive = Boolean(alert.active);
  const alertTresholdText = formatAlertTreshold(alert);

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
          ⚠️ {getTitle(alert)}
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
        {formatValue(alert)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        🕒 {new Date(alert.timestamp).toLocaleString("cs-CZ")}
      </Typography>
      {alertTresholdText && (
        <Typography variant="body2" color="text.secondary">
          Limity: {alertTresholdText}
        </Typography>
      )}

      {actions ? (
        <Box display="flex" gap={1.5} mt={1.5}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
