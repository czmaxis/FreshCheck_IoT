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

function renderValue(alert) {
  if (alert.type === "humidity") {
    return (
      <Chip
        icon={<WaterDropIcon />}
        label={`${alert.value ?? "-"} %`}
        sx={{
          backgroundColor: "#42a5f515",
          border: "1px solid #42a5f530",
          fontWeight: 600,
          fontSize: "0.95rem",
          "& .MuiChip-icon": { color: "#42a5f5" },
          "& .MuiChip-label": { color: "#42a5f5" },
        }}
      />
    );
  }
  if (alert.type === "temperature") {
    return (
      <Chip
        icon={<ThermostatIcon />}
        label={`${alert.value ?? "-"} °C`}
        sx={{
          backgroundColor: "#ef535015",
          border: "1px solid #ef535030",
          fontWeight: 600,
          fontSize: "0.95rem",
          "& .MuiChip-icon": { color: "#ef5350" },
          "& .MuiChip-label": { color: "#ef5350" },
        }}
      />
    );
  }
  if (alert.type === "door" || alert.type === "doorOpen") {
    return (
      <Chip
        icon={<DoorFrontIcon />}
        label={`${alert.value ?? "-"} s`}
        sx={{
          backgroundColor: "#ff980015",
          border: "1px solid #ff980030",
          fontWeight: 600,
          fontSize: "0.95rem",
          "& .MuiChip-icon": { color: "#ff9800" },
          "& .MuiChip-label": { color: "#ff9800" },
        }}
      />
    );
  }
  return (
    <Chip
      label={`${alert.value ?? "-"}`}
      sx={{
        backgroundColor: "#9e9e9e15",
        border: "1px solid #9e9e9e30",
        fontWeight: 600,
        fontSize: "0.95rem",
        "& .MuiChip-label": { color: "#9e9e9e" },
      }}
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
  if (!alert.active) return "#66bb6a"; // zelená pro vyřešené

  switch (alert.type) {
    case "temperature":
      return "#ef5350"; // červená
    case "humidity":
      return "#42a5f5"; // modrá
    case "door":
    case "doorOpen":
      return "#ff9800"; // oranžová
    default:
      return "#9e9e9e"; // šedá
  }
}

export default function AlertCard({
  alert,
  actions,
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
            {getTitle(alert)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          {!isActive && (
            <Chip
              size="small"
              label="Vyřešená"
              sx={{
                backgroundColor: "#66bb6a20",
                color: "#66bb6a",
                fontWeight: 600,
                border: "1px solid #66bb6a40",
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
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onResolve();
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircleIcon
                        fontSize="small"
                        sx={{ color: "#66bb6a" }}
                      />
                    </ListItemIcon>
                    <ListItemText>Potvrdit</ListItemText>
                  </MenuItem>
                )}
                {!isActive && onRestore && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onRestore();
                    }}
                  >
                    <ListItemIcon>
                      <RestoreIcon fontSize="small" sx={{ color: "#42a5f5" }} />
                    </ListItemIcon>
                    <ListItemText>Vrátit do aktivního stavu</ListItemText>
                  </MenuItem>
                )}
                {onDelete && (
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      onDelete();
                    }}
                  >
                    <ListItemIcon>
                      <DeleteOutlineIcon
                        fontSize="small"
                        sx={{ color: "#ef5350" }}
                      />
                    </ListItemIcon>
                    <ListItemText sx={{ color: "#ef5350" }}>
                      Smazat
                    </ListItemText>
                  </MenuItem>
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

      {actions ? (
        <Box display="flex" gap={1.5} mt={2}>
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
