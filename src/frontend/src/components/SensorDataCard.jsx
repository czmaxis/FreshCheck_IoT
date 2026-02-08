import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours() + 1).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function parseDoorState(item) {
  if (item?.doors === true || item?.doors === 1 || item?.doors === "1") {
    return 1;
  }
  if (item?.doors === false || item?.doors === 0 || item?.doors === "0") {
    return 0;
  }

  const illuminance = item?.illuminance;
  if (illuminance === undefined || illuminance === null) return null;
  if (Number.isNaN(Number(illuminance))) return null;
  return Number(illuminance) > 0 ? 1 : 0;
}

function getDoorStateFromItem(item) {
  const state = parseDoorState(item);
  if (state == null) return { label: "—", color: "default" };
  if (state === 0) return { label: "Zavřeno", color: "success" };
  return { label: "Otevřeno", color: "warning" };
}

/**
 * SensorDataCard - moderní kartička pro zobrazení naměřených dat
 *
 * @param {Object} props
 * @param {Object} props.item - data senzoru
 * @param {boolean} props.isMobile - zda je mobilní zobrazení
 */
export default function SensorDataCard({ item, isMobile = false }) {
  const door = getDoorStateFromItem(item);

  // Určení dominantní barvy podle hodnot
  const getAccentColor = () => {
    if (item.temperature != null) return "#ef5350"; // červená
    if (item.humidity != null) return "#42a5f5"; // modrá
    if (door.color === "warning") return "#ff9800"; // oranžová
    return "#9e9e9e"; // šedá
  };

  const accentColor = getAccentColor();

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 2.5,
        borderRadius: 3,
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          transform: "translateY(-2px) scale(1.005)",
        },
      }}
    >
      <Stack
        direction={isMobile ? "column" : "row"}
        alignItems={isMobile ? "flex-start" : "center"}
        justifyContent="space-between"
        spacing={isMobile ? 2 : 0}
      >
        {/* Čas */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: `${accentColor}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AccessTimeIcon fontSize="small" sx={{ color: accentColor }} />
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {formatTimestamp(item.timestamp)}
          </Typography>
        </Box>

        {/* Hodnoty */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{
            width: isMobile ? "100%" : "auto",
            flexWrap: "wrap",
            rowGap: 1.5,
          }}
        >
          {/* Teplota */}
          {item.temperature != null && (
            <Chip
              icon={<DeviceThermostatIcon />}
              label={`${item.temperature} °C`}
              sx={{
                backgroundColor: "#ef535015",
                border: "1px solid #ef535030",
                fontWeight: 600,
                "& .MuiChip-icon": { color: "#ef5350" },
                "& .MuiChip-label": { color: "#ef5350" },
              }}
            />
          )}

          {/* Vlhkost */}
          {item.humidity != null && (
            <Chip
              icon={<OpacityIcon />}
              label={`${item.humidity} %`}
              sx={{
                backgroundColor: "#42a5f515",
                border: "1px solid #42a5f530",
                fontWeight: 600,
                "& .MuiChip-icon": { color: "#42a5f5" },
                "& .MuiChip-label": { color: "#42a5f5" },
              }}
            />
          )}

          {/* Dveře */}
          <Chip
            icon={<DoorFrontIcon />}
            label={isMobile ? door.label : `Dveře: ${door.label}`}
            sx={{
              backgroundColor:
                door.color === "success"
                  ? "#66bb6a15"
                  : door.color === "warning"
                    ? "#ff980015"
                    : "#9e9e9e15",
              border:
                door.color === "success"
                  ? "1px solid #66bb6a30"
                  : door.color === "warning"
                    ? "1px solid #ff980030"
                    : "1px solid #9e9e9e30",
              fontWeight: 600,
              "& .MuiChip-icon": {
                color:
                  door.color === "success"
                    ? "#66bb6a"
                    : door.color === "warning"
                      ? "#ff9800"
                      : "#9e9e9e",
              },
              "& .MuiChip-label": {
                color:
                  door.color === "success"
                    ? "#66bb6a"
                    : door.color === "warning"
                      ? "#ff9800"
                      : "#9e9e9e",
              },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
