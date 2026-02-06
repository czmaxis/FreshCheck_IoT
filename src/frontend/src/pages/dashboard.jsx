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
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

import { useAuth } from "../context/AuthContext.jsx";
import {
  getDevices,
  updateDevice,
  createDevice,
  deleteDevice,
  getDevice,
} from "../services/deviceService.js";

import SensorData from "./sensorData.jsx";
import DeviceCharts from "./deviceCharts.jsx";
import NavBar from "./navBar.jsx";
import Alerts from "./alerts.jsx";
import DashboardSummary from "../components/DashboardSummary.jsx";
export default function Dashboard() {
  const { user, token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  // settings menu state (gear icon)
  const [anchorSettings, setAnchorSettings] = useState(null);
  const settingsOpen = Boolean(anchorSettings);

  // dialog state for limits
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [maxTemp, setMaxTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxHumidity, setMaxHumidity] = useState("");
  const [minHumidity, setMinHumidity] = useState("");

  // dialog state for add device
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  // selected device id
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const selectedDevice = devices.find((d) => d._id === selectedDeviceId);
  const [summaryDeviceThreshold, setSummaryDeviceThreshold] = useState(null);
  const [limitsVersion, setLimitsVersion] = useState(0);

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
          err.response?.data?.message || "Nepodařilo se načíst zařízení.",
        );
      }
    }

    load();
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadThreshold() {
      if (!selectedDeviceId) {
        setSummaryDeviceThreshold(null);
        return;
      }

      try {
        const device = await getDevice(selectedDeviceId, token);
        if (!cancelled) {
          setSummaryDeviceThreshold(device?.threshold ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setSummaryDeviceThreshold(null);
        }
      }
    }

    loadThreshold();
    return () => {
      cancelled = true;
    };
  }, [selectedDeviceId, token]);

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
  };

  // settings menu handlers
  const handleOpenSettings = (event) => {
    setAnchorSettings(event.currentTarget);
  };
  const handleCloseSettings = () => setAnchorSettings(null);

  const handleSettingsSelect = (action) => {
    handleCloseSettings();
    if (action === "add") {
      setAddOpen(true);
    }
    if (action === "edit") {
      if (!selectedDeviceId) {
        setError("Nejprve vyberte zařízení k úpravě.");
        return;
      }

      const current = devices.find((d) => d._id === selectedDeviceId) || null;
      setEditName(current?.name || "");
      setEditLocation(current?.location || "");
      setEditOpen(true);
    }
    if (action === "remove") {
      if (!selectedDeviceId) {
        setError("Nejprve vyberte zařízení k odebrání.");
        return;
      }
      setRemoveOpen(true);
    }
  };

  const openLimitsDialog = () => {
    if (!selectedDeviceId) {
      setError("Nejprve vyberte zařízení pro nastavení limitů.");
      return;
    }

    const t = summaryDeviceThreshold ?? selectedDevice?.threshold ?? null;
    if (t) {
      setMaxTemp(t?.temperature?.max ?? "");
      setMinTemp(t?.temperature?.min ?? "");
      setMaxHumidity(t?.humidity?.max ?? "");
      setMinHumidity(t?.humidity?.min ?? "");
    } else {
      setMaxTemp("");
      setMinTemp("");
      setMaxHumidity("");
      setMinHumidity("");
    }

    setLimitsOpen(true);
  };

  const handleLimitsConfirm = async () => {
    if (!selectedDeviceId) return;

    // sestavení threshold jen z vyplněných hodnot
    const threshold = {};

    if (minTemp !== "" || maxTemp !== "") {
      threshold.temperature = {};
      if (minTemp !== "") threshold.temperature.min = Number(minTemp);
      if (maxTemp !== "") threshold.temperature.max = Number(maxTemp);
    }

    if (minHumidity !== "" || maxHumidity !== "") {
      threshold.humidity = {};
      if (minHumidity !== "") threshold.humidity.min = Number(minHumidity);
      if (maxHumidity !== "") threshold.humidity.max = Number(maxHumidity);
    }

    if (Object.keys(threshold).length === 0) {
      setError("Vyplň alespoň jeden limit.");
      return;
    }
    // pokud uživatel nevyplnil NIC → nedělej request
    if (Object.keys(threshold).length === 0) {
      setError("Vyplň alespoň jednu hodnotu limitu.");
      return;
    }

    try {
      const payload = { threshold };

      const res = await updateDevice(selectedDeviceId, payload, token);

      setDevices((prev) =>
        prev.map((d) => (d._id === selectedDeviceId ? res.device : d)),
      );
      setSummaryDeviceThreshold(res.device?.threshold ?? null);
      setLimitsVersion((v) => v + 1);

      // reset formuláře
      setMinTemp(null);
      setMaxTemp(null);
      setMinHumidity(null);
      setMaxHumidity(null);

      setLimitsOpen(false);
    } catch (err) {
      console.error("Chyba při ukládání limitů:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se uložit limity zařízení.",
      );
    }
  };

  const handleLimitsCancel = () => {
    setLimitsOpen(false);
  };

  const handleAddConfirm = async () => {
    try {
      const payload = {
        name: newName,
        location: newLocation,
      };

      const res = await createDevice(payload, token);

      // backend vrací { status, device }
      setDevices((prev) => [...prev, res.device]);
      setSelectedDeviceId(res.device._id);

      // reset formuláře
      setNewName("");
      setNewLocation("");
      setAddOpen(false);
    } catch (err) {
      console.error("Chyba při vytváření zařízení:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se vytvořit nové zařízení.",
      );
    }
  };

  const handleAddCancel = () => {
    setAddOpen(false);
  };

  const handleEditCancel = () => {
    setEditOpen(false);
  };

  const handleEditConfirm = async () => {
    if (!selectedDeviceId) return;
    if (!editName.trim()) {
      setError("Vyplňte název zařízení.");
      return;
    }

    try {
      const payload = {
        name: editName.trim(),
        location: editLocation.trim(),
      };
      const res = await updateDevice(selectedDeviceId, payload, token);
      setDevices((prev) =>
        prev.map((d) => (d._id === selectedDeviceId ? res.device : d)),
      );
      setEditOpen(false);
    } catch (err) {
      console.error("Chyba při úpravě zařízení:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se upravit zařízení.",
      );
    }
  };

  const handleRemoveCancel = () => {
    if (!removeBusy) setRemoveOpen(false);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedDeviceId || removeBusy) return;
    setRemoveBusy(true);
    try {
      await deleteDevice(selectedDeviceId, token);
      setDevices((prev) => {
        const next = prev.filter((d) => d._id !== selectedDeviceId);
        setSelectedDeviceId(next.length > 0 ? next[0]._id : null);
        return next;
      });
      setRemoveOpen(false);
    } catch (err) {
      console.error("Chyba při odebrání zařízení:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se odebrat zařízení.",
      );
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <>
      <NavBar />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        minHeight="100vh"
        p={2}
      >
        <Box mt={3} display="flex" alignItems="center" gap={1}>
          <FormControl variant="standard" sx={{ minWidth: 220 }}>
            <InputLabel id="device-select-label">Vyber zařízení</InputLabel>
            <Select
              labelId="device-select-label"
              value={selectedDeviceId ?? ""}
              label="Vyber zařízení"
              onChange={(e) => handleSelectDevice(e.target.value)}
            >
              {devices && devices.length > 0 ? (
                devices.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} — {d.location}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  Žádná zařízení
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {/* gear icon next to device selector */}
          <IconButton
            aria-label="nastavení zařízení"
            onClick={handleOpenSettings}
            size="small"
          >
            <SettingsIcon />
          </IconButton>

          <Menu
            anchorEl={anchorSettings}
            open={settingsOpen}
            onClose={handleCloseSettings}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
          <MenuItem onClick={() => handleSettingsSelect("edit")}>
            Upravit zařízení
          </MenuItem>
            <MenuItem onClick={() => handleSettingsSelect("add")}>
              Přidat zařízení
            </MenuItem>
            <MenuItem onClick={() => handleSettingsSelect("remove")}>
              Odebrat zařízení
            </MenuItem>
          </Menu>
        </Box>
        <DashboardSummary
          deviceId={selectedDeviceId}
          token={token}
          onOpenLimits={openLimitsDialog}
          refreshKey={limitsVersion}
        />
        <p />
        {selectedDeviceId && (
          <Alerts deviceId={selectedDeviceId} sx={{ mb: 2, mt: 2 }} />
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2, mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box width="100%" mt={4}>
          {selectedDeviceId ? (
            <>
              <SensorData deviceId={selectedDeviceId} />
              <DeviceCharts
                deviceId={selectedDeviceId}
                refreshKey={limitsVersion}
              />
            </>
          ) : (
            <Typography sx={{ mt: 2 }}>
              Zvolte zařízení z nabídky pro zobrazení dat.
            </Typography>
          )}
        </Box>
        {/* Limits dialog */}
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
                label="Minimální teplota (°C)"
                type="number"
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
              />

              <TextField
                label="Maximální teplota (°C)"
                type="number"
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
              />

              <TextField
                label="Minimální vlhkost (%)"
                type="number"
                value={minHumidity}
                onChange={(e) => setMinHumidity(e.target.value)}
              />

              <TextField
                label="Maximální vlhkost (%)"
                type="number"
                value={maxHumidity}
                onChange={(e) => setMaxHumidity(e.target.value)}
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
        <Dialog
          open={addOpen}
          onClose={handleAddCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Přidat nové zařízení</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Název zařízení"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Lokace"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddCancel}>Zrušit</Button>
            <Button variant="contained" onClick={handleAddConfirm}>
              Přidat
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={editOpen}
          onClose={handleEditCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Upravit zařízení</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Název zařízení"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Lokace"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditCancel}>Zrušit</Button>
            <Button variant="contained" onClick={handleEditConfirm}>
              Uložit
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={removeOpen}
          onClose={handleRemoveCancel}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Odebrat zařízení</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Opravdu chcete odebrat zařízení{" "}
              <strong>
                {devices.find((d) => d._id === selectedDeviceId)?.name || "-"}
              </strong>
              ?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRemoveCancel} disabled={removeBusy}>
              Zrušit
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRemoveConfirm}
              disabled={removeBusy}
            >
              Odebrat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
