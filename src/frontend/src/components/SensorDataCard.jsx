import { Box, Typography, Stack, Chip } from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getDoorStateFromItem } from "../utils/doorStateUtils.js";
import {
  COLOR_TEMPERATURE,
  COLOR_HUMIDITY,
  COLOR_DOOR_OPEN,
  COLOR_DOOR_CLOSED,
  COLOR_DEFAULT,
  chipSx,
} from "../constants/colors.js";

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

/**
 * SensorDataCard - moderní kartička pro zobrazení naměřených dat
 *
 * @param {Object} props
 * @param {Object} props.item - data senzoru
 * @param {boolean} props.isMobile - zda je mobilní zobrazení
 */
export default function SensorDataCard({ item, isMobile = false }) {
  const door = getDoorStateFromItem(item);

  const getAccentColor = () => {
    if (item.temperature != null) return COLOR_TEMPERATURE;
    if (item.humidity != null) return COLOR_HUMIDITY;
    if (door.color === "warning") return COLOR_DOOR_OPEN;
    return COLOR_DEFAULT;
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
              sx={chipSx(COLOR_TEMPERATURE)}
            />
          )}

          {/* Vlhkost */}
          {item.humidity != null && (
            <Chip
              icon={<OpacityIcon />}
              label={`${item.humidity} %`}
              sx={chipSx(COLOR_HUMIDITY)}
            />
          )}

          {/* Dveře */}
          <Chip
            icon={<DoorFrontIcon />}
            label={isMobile ? door.label : `Dveře: ${door.label}`}
            sx={chipSx(
              door.color === "success"
                ? COLOR_DOOR_CLOSED
                : door.color === "warning"
                  ? COLOR_DOOR_OPEN
                  : COLOR_DEFAULT,
            )}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
