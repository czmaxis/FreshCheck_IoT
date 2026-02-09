import { useEffect, useState, useCallback } from "react";
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from "../services/deviceService.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useDashboardDevices() {
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [error, setError] = useState("");

  // settings menu
  const [anchorSettings, setAnchorSettings] = useState(null);
  const settingsOpen = Boolean(anchorSettings);

  // add device dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // edit device dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // remove device dialog
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  const selectedDevice = devices.find((d) => d._id === selectedDeviceId);

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

  const handleSelectDevice = useCallback((deviceId) => {
    setSelectedDeviceId(deviceId);
  }, []);

  // --- Settings menu ---
  const handleOpenSettings = useCallback((event) => {
    setAnchorSettings(event.currentTarget);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setAnchorSettings(null);
  }, []);

  const handleSettingsSelect = useCallback(
    (action) => {
      setAnchorSettings(null);
      if (action === "add") {
        setAddOpen(true);
      }
      if (action === "edit") {
        if (!selectedDeviceId) {
          setError("Nejprve vyberte zařízení k úpravě.");
          return;
        }
        const current =
          devices.find((d) => d._id === selectedDeviceId) || null;
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
    },
    [selectedDeviceId, devices],
  );

  // --- Add device ---
  const handleAddConfirm = useCallback(async () => {
    try {
      const payload = { name: newName, location: newLocation };
      const res = await createDevice(payload, token);
      setDevices((prev) => [...prev, res.device]);
      setSelectedDeviceId(res.device._id);
      setNewName("");
      setNewLocation("");
      setAddOpen(false);
    } catch (err) {
      console.error("Chyba při vytváření zařízení:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se vytvořit nové zařízení.",
      );
    }
  }, [newName, newLocation, token]);

  const handleAddCancel = useCallback(() => {
    setAddOpen(false);
  }, []);

  // --- Edit device ---
  const handleEditConfirm = useCallback(async () => {
    if (!selectedDeviceId) return;
    if (!editName.trim()) {
      setError("Vyplňte název zařízení.");
      return;
    }
    try {
      const payload = { name: editName.trim(), location: editLocation.trim() };
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
  }, [selectedDeviceId, editName, editLocation, token]);

  const handleEditCancel = useCallback(() => {
    setEditOpen(false);
  }, []);

  // --- Remove device ---
  const handleRemoveConfirm = useCallback(async () => {
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
  }, [selectedDeviceId, removeBusy, token]);

  const handleRemoveCancel = useCallback(() => {
    if (!removeBusy) setRemoveOpen(false);
  }, [removeBusy]);

  return {
    devices,
    setDevices,
    selectedDeviceId,
    selectedDevice,
    error,
    setError,
    handleSelectDevice,
    // settings menu
    anchorSettings,
    settingsOpen,
    handleOpenSettings,
    handleCloseSettings,
    handleSettingsSelect,
    // add
    addOpen,
    newName,
    setNewName,
    newLocation,
    setNewLocation,
    handleAddConfirm,
    handleAddCancel,
    // edit
    editOpen,
    editName,
    setEditName,
    editLocation,
    setEditLocation,
    handleEditConfirm,
    handleEditCancel,
    // remove
    removeOpen,
    removeBusy,
    handleRemoveConfirm,
    handleRemoveCancel,
  };
}
