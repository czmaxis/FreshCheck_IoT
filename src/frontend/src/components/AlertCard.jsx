import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import {
  COLOR_TEMPERATURE,
  COLOR_HUMIDITY,
  COLOR_DOOR_OPEN,
  COLOR_DOOR_CLOSED,
  COLOR_DEFAULT,
  chipSx,
} from "../constants/colors.js";

export function getAlertTitle(alert) {
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

function renderValue(alert) {
  if (alert.type === "humidity") {
    return (
      <Chip
        icon={<WaterDropIcon />}
        label={`${alert.value ?? "-"} %`}
        sx={{ ...chipSx(COLOR_HUMIDITY), fontSize: "0.95rem" }}
      />
    );
  }
  if (alert.type === "temperature") {
    return (
      <Chip
        icon={<ThermostatIcon />}
        label={`${alert.value ?? "-"} °C`}
        sx={{ ...chipSx(COLOR_TEMPERATURE), fontSize: "0.95rem" }}
      />
    );
  }
  if (alert.type === "door" || alert.type === "doorOpen") {
    return (
      <Chip
        icon={<DoorFrontIcon />}
        label={`${alert.value ?? "-"} s`}
        sx={{ ...chipSx(COLOR_DOOR_OPEN), fontSize: "0.95rem" }}
      />
    );
  }
  return (
    <Chip
      label={`${alert.value ?? "-"}`}
      sx={{ ...chipSx(COLOR_DEFAULT), fontSize: "0.95rem" }}
    />
  );
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

  return null;
}

function getAccentColor(alert) {
  if (!alert.active) return COLOR_DOOR_CLOSED;

  switch (alert.type) {
    case "temperature":
      return COLOR_TEMPERATURE;
    case "humidity":
      return COLOR_HUMIDITY;
    case "door":
    case "doorOpen":
      return COLOR_DOOR_OPEN;
    default:
      return COLOR_DEFAULT;
  }
}

export default function AlertCard({
  alert,
  onResolve,
  onRestore,
  onDelete,
}) {
  const isActive = Boolean(alert.active);
  const alertTresholdText = formatAlertTreshold(alert);
  const accentColor = getAccentColor(alert);
  const hasMenu = Boolean(onResolve || onRestore || onDelete);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  return (
    <Box
      sx={{
        mb: 2,
        p: 2.5,
        borderRadius: 3,
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          transform: "translateY(-2px) scale(1.005)",
        },
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
      >
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
            <WarningAmberIcon fontSize="small" sx={{ color: accentColor }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {getAlertTitle(alert)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {!isActive && (
            <Chip
              size="small"
              label="Vyřešená"
              sx={{
                backgroundColor: `${COLOR_DOOR_CLOSED}20`,
                color: COLOR_DOOR_CLOSED,
                fontWeight: 600,
                border: `1px solid ${COLOR_DOOR_CLOSED}40`,
              }}
            />
          )}

          {hasMenu && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                      minWidth: 180,
                    },
                  },
                }}
              >
                {isActive && onResolve && (
                  <Tooltip
                    title="Označí výstrahu jako vyřešenou a přesune ji do historie výstrah"
                    placement="top"
                    enterDelay={600}
                    enterNextDelay={300}
                    enterTouchDelay={400}
                    leaveTouchDelay={3000}
                  >
                    <MenuItem
                      onClick={() => {
                        setMenuAnchor(null);
                        onResolve();
                      }}
                    >
                      <ListItemIcon>
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: COLOR_DOOR_CLOSED }}
                        />
                      </ListItemIcon>
                      <ListItemText>Potvrdit</ListItemText>
                    </MenuItem>
                  </Tooltip>
                )}
                {!isActive && onRestore && (
                  <Tooltip
                    title="Vrátí výstrahu zpět mezi aktivní nevyřešené"
                    placement="top"
                    enterDelay={600}
                    enterNextDelay={300}
                    enterTouchDelay={400}
                    leaveTouchDelay={3000}
                  >
                    <MenuItem
                      onClick={() => {
                        setMenuAnchor(null);
                        onRestore();
                      }}
                    >
                      <ListItemIcon>
                        <RestoreIcon fontSize="small" sx={{ color: COLOR_HUMIDITY }} />
                      </ListItemIcon>
                      <ListItemText>Vrátit do aktivního stavu</ListItemText>
                    </MenuItem>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip
                    title="Trvale smaže výstrahu, nebude viditelná v historii"
                    placement="top"
                    enterDelay={600}
                    enterNextDelay={300}
                    enterTouchDelay={400}
                    leaveTouchDelay={3000}
                  >
                    <MenuItem
                      onClick={() => {
                        setMenuAnchor(null);
                        onDelete();
                      }}
                    >
                      <ListItemIcon>
                        <DeleteOutlineIcon
                          fontSize="small"
                          sx={{ color: COLOR_TEMPERATURE }}
                        />
                      </ListItemIcon>
                      <ListItemText sx={{ color: COLOR_TEMPERATURE }}>
                        Smazat
                      </ListItemText>
                    </MenuItem>
                  </Tooltip>
                )}
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 1.5, ml: 0.5 }}>{renderValue(alert)}</Box>

      <Box display="flex" alignItems="center" gap={1} ml={0.5}>
        <AccessTimeIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          {new Date(alert.timestamp).toLocaleString("cs-CZ")}
        </Typography>
      </Box>

      {alertTresholdText && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, ml: 0.5 }}
        >
          {alertTresholdText}
        </Typography>
      )}

    </Box>
  );
}
