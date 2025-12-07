import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js";
import SensorData from "./sensorData.jsx";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  // menu state for context menu
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // selected device id
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const data = await getDevices(token);
        setDevices(data || []);

        // if there's at least one device and nothing selected yet, select first
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      minHeight="100vh"
      p={4}
    >
      <Typography variant="h4" gutterBottom>
        Vítej na dashboardu!
      </Typography>

      {user ? (
        <Typography variant="h5">Přihlášený uživatel: {user.name}</Typography>
      ) : (
        <Typography variant="h6" color="error">
          Uživatel není přihlášen.
        </Typography>
      )}

      <Box mt={3} display="flex" alignItems="center" gap={2}>
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
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2, mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box width="100%" mt={4}>
        {selectedDeviceId ? (
          <SensorData deviceId={selectedDeviceId} />
        ) : (
          <Typography sx={{ mt: 2 }}>
            Zvolte zařízení z nabídky pro zobrazení dat.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
