import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js";
import SensorData from "./sensorData.jsx";
import DeviceCharts from "./deviceCharts.jsx";
import NavBar from "./navBar.jsx";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  // devices menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // settings menu state (gear icon)
  const [anchorSettings, setAnchorSettings] = useState(null);
  const settingsOpen = Boolean(anchorSettings);

  // dialog state for limits
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [limitTemp, setLimitTemp] = useState(25);
  const [limitHumidity, setLimitHumidity] = useState(60);
  const [openTime, setOpenTime] = useState("08:00");

  // selected device id
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const data = await getDevices(token);
        setDevices(data || []);

        if (data && data.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(data[0]._id);
        }
      } catch (err) {
        console.error("Chyba při načítání zařízení:", err);
        setError(
          err.response?.data?.message || "Nepodařilo se načíst zařízení."
        );
      }
    }

    load();
  }, [token]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    handleCloseMenu();
  };

  // settings menu handlers
  const handleOpenSettings = (event) => {
    setAnchorSettings(event.currentTarget);
  };
  const handleCloseSettings = () => setAnchorSettings(null);

  const handleSettingsSelect = (action) => {
    handleCloseSettings();
    if (action === "limits") {
      // open dialog for limits
      setLimitsOpen(true);
    } else if (action === "add") {
      // future: open add device dialog / route
      console.log("Přidat zařízení - TODO");
    }
  };

  const handleLimitsConfirm = () => {
    // no backend yet — just log values and close
    console.log("Ulož limity:", {
      limitTemp,
      limitHumidity,
      openTime,
      selectedDeviceId,
    });
    setLimitsOpen(false);
  };

  const handleLimitsCancel = () => {
    setLimitsOpen(false);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      minHeight="100vh"
      p={2}
    >
      <NavBar />

      <Box mt={3} display="flex" alignItems="center" gap={1}>
        <Typography variant="h6">Zařízení:</Typography>

        <Button
          variant="outlined"
          onClick={handleOpenMenu}
          data-testid="devices-menu-button"
        >
          {selectedDeviceId
            ? devices.find((d) => d._id === selectedDeviceId)?.name ||
              "Vyber zařízení"
            : "Vyber zařízení"}
        </Button>

        {/* gear icon next to device selector */}
        <IconButton
          aria-label="nastavení zařízení"
          onClick={handleOpenSettings}
          size="small"
        >
          <SettingsIcon />
        </IconButton>

        <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleCloseMenu}>
          {devices && devices.length > 0 ? (
            devices.map((d) => (
              <MenuItem key={d._id} onClick={() => handleSelectDevice(d._id)}>
                {d.name} — {d.location}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>Žádná zařízení</MenuItem>
          )}
        </Menu>

        <Menu
          anchorEl={anchorSettings}
          open={settingsOpen}
          onClose={handleCloseSettings}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => handleSettingsSelect("limits")}>
            Nastavit limity
          </MenuItem>
          <MenuItem onClick={() => handleSettingsSelect("add")}>
            Přidat zařízení
          </MenuItem>
        </Menu>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2, mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box width="100%" mt={4}>
        {selectedDeviceId ? (
          <>
            <SensorData deviceId={selectedDeviceId} />
            <DeviceCharts deviceId={selectedDeviceId} />
          </>
        ) : (
          <Typography sx={{ mt: 2 }}>
            Zvolte zařízení z nabídky pro zobrazení dat.
          </Typography>
        )}
      </Box>

      {/* Limits dialog (no backend logic, UI only) */}
      <Dialog
        open={limitsOpen}
        onClose={handleLimitsCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nastavit limity pro zařízení</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Maximální teplota (°C)"
              type="number"
              value={limitTemp}
              onChange={(e) => setLimitTemp(Number(e.target.value))}
              fullWidth
            />

            <TextField
              label="Maximální vlhkost (%)"
              type="number"
              value={limitHumidity}
              onChange={(e) => setLimitHumidity(Number(e.target.value))}
              fullWidth
            />

            <TextField
              label="Čas otevření"
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <Typography variant="body2" color="text.secondary">
              Aplikují se limity pro zařízení:{" "}
              {devices.find((d) => d._id === selectedDeviceId)?.name || "-"}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLimitsCancel}>Zrušit</Button>
          <Button variant="contained" onClick={handleLimitsConfirm}>
            Potvrdit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
