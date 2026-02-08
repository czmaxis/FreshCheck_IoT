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
import LimitsSkeleton from "../components/LimitsSkeleton.jsx";

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
  const [limitsError, setLimitsError] = useState("");
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
  const [limitsSaving, setLimitsSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRefreshTick((v) => v + 1);
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

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
  }, [selectedDeviceId, token, refreshTick]);

  const handleSelectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
  };

  const handleAlertsChanged = () => {
    setAlertsRefreshKey((v) => v + 1);
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

    setLimitsError("");
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
      setLimitsSaving(true);
      setLimitsError("");
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
      setLimitsError(
        err.response?.data?.message || "Nepodařilo se uložit limity zařízení.",
      );
    } finally {
      setLimitsSaving(false);
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
        p={{ xs: 1.5, sm: 2 }}
        sx={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Box
          mt={3}
          display="flex"
          alignItems="center"
          gap={2}
          flexWrap="wrap"
          sx={{ width: "100%", maxWidth: 900 }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: { xs: "100%", sm: 280 },
              p: 2,
              borderRadius: 3,
              backgroundColor: "background.paper",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              },
            }}
          >
            <FormControl
              variant="standard"
              fullWidth
              sx={{
                "& .MuiInputLabel-root": {
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&.Mui-focused": {
                    color: "primary.main",
                  },
                },
                "& .MuiInput-root": {
                  fontSize: "1rem",
                  fontWeight: 500,
                  "&:before": {
                    borderBottom: "none",
                  },
                  "&:after": {
                    borderBottom: "2px solid",
                    borderColor: "primary.main",
                  },
                  "&:hover:not(.Mui-disabled):before": {
                    borderBottom: "none",
                  },
                },
              }}
            >
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
          </Box>

          {/* gear icon next to device selector */}
          <IconButton
            aria-label="nastavení zařízení"
            onClick={handleOpenSettings}
            sx={{
              width: 48,
              height: 48,
              backgroundColor: "background.paper",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "background.paper",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                transform: "scale(1.05)",
              },
            }}
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
          refreshKey={limitsVersion + refreshTick + alertsRefreshKey}
          limitsLoading={limitsSaving}
        />
        <p />
        {selectedDeviceId && (
          <Alerts
            deviceId={selectedDeviceId}
            refreshKey={refreshTick}
            onAlertsChanged={handleAlertsChanged}
            sx={{ mb: 2, mt: 2 }}
          />
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2, mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box width="100%" mt={4}>
          {selectedDeviceId ? (
            <>
              <SensorData deviceId={selectedDeviceId} refreshKey={refreshTick} />
              <DeviceCharts
                deviceId={selectedDeviceId}
                refreshKey={limitsVersion + refreshTick}
                limitsLoading={limitsSaving}
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
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
              pb: 1,
            }}
          >
            Nastavit limity pro zařízení
          </DialogTitle>
          <DialogContent>
            {limitsError && (
              <Typography color="error" sx={{ mb: 1 }}>
                {limitsError}
              </Typography>
            )}
            {limitsSaving ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <LimitsSkeleton lines={5} />
              </Stack>
            ) : (
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <TextField
                  label="Minimální teplota (°C)"
                  type="number"
                  value={minTemp}
                  onChange={(e) => setMinTemp(e.target.value)}
                  variant="outlined"
                  fullWidth
                />

                <TextField
                  label="Maximální teplota (°C)"
                  type="number"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(e.target.value)}
                  variant="outlined"
                  fullWidth
                />

                <TextField
                  label="Minimální vlhkost (%)"
                  type="number"
                  value={minHumidity}
                  onChange={(e) => setMinHumidity(e.target.value)}
                  variant="outlined"
                  fullWidth
                />

                <TextField
                  label="Maximální vlhkost (%)"
                  type="number"
                  value={maxHumidity}
                  onChange={(e) => setMaxHumidity(e.target.value)}
                  variant="outlined"
                  fullWidth
                />

                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Aplikují se limity pro zařízení:{" "}
                  <strong>
                    {devices.find((d) => d._id === selectedDeviceId)?.name || "-"}
                  </strong>
                </Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={handleLimitsCancel}
              disabled={limitsSaving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="contained"
              onClick={handleLimitsConfirm}
              disabled={limitsSaving}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              Potvrdit
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={addOpen}
          onClose={handleAddCancel}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
              pb: 1,
            }}
          >
            Přidat nové zařízení
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Název zařízení"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Lokace"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={handleAddCancel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="contained"
              onClick={handleAddConfirm}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              Přidat
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={editOpen}
          onClose={handleEditCancel}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
              pb: 1,
            }}
          >
            Upravit zařízení
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Název zařízení"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Lokace"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={handleEditCancel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="contained"
              onClick={handleEditConfirm}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              Uložit
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={removeOpen}
          onClose={handleRemoveCancel}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
              pb: 1,
              color: "error.main",
            }}
          >
            Odebrat zařízení
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
              Opravdu chcete odebrat zařízení{" "}
              <strong>
                {devices.find((d) => d._id === selectedDeviceId)?.name || "-"}
              </strong>
              ?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={handleRemoveCancel}
              disabled={removeBusy}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRemoveConfirm}
              disabled={removeBusy}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(239, 83, 80, 0.3)",
              }}
            >
              Odebrat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
