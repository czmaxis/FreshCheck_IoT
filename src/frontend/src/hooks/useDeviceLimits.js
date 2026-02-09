import { useState, useCallback } from "react";
import { updateDevice } from "../services/deviceService.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useDeviceLimits(
  selectedDeviceId,
  device,
  setDevice,
  setDevices,
  setError,
) {
  const { token } = useAuth();

  const [limitsSaving, setLimitsSaving] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [limitsError, setLimitsError] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxHumidity, setMaxHumidity] = useState("");
  const [minHumidity, setMinHumidity] = useState("");

  const summaryDeviceThreshold = device?.threshold ?? null;

  const openLimitsDialog = useCallback(() => {
    if (!selectedDeviceId) {
      setError("Nejprve vyberte zařízení pro nastavení limitů.");
      return;
    }

    const t = summaryDeviceThreshold;
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
  }, [selectedDeviceId, summaryDeviceThreshold, setError]);

  const handleLimitsConfirm = useCallback(async () => {
    if (!selectedDeviceId) return;

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

    try {
      setLimitsSaving(true);
      setLimitsError("");
      const payload = { threshold };
      const res = await updateDevice(selectedDeviceId, payload, token);

      setDevices((prev) =>
        prev.map((d) => (d._id === selectedDeviceId ? res.device : d)),
      );
      setDevice(res.device);

      setMinTemp("");
      setMaxTemp("");
      setMinHumidity("");
      setMaxHumidity("");
      setLimitsOpen(false);
    } catch (err) {
      console.error("Chyba při ukládání limitů:", err);
      setLimitsError(
        err.response?.data?.message || "Nepodařilo se uložit limity zařízení.",
      );
    } finally {
      setLimitsSaving(false);
    }
  }, [
    selectedDeviceId,
    minTemp,
    maxTemp,
    minHumidity,
    maxHumidity,
    token,
    setDevices,
    setDevice,
    setError,
  ]);

  const handleLimitsCancel = useCallback(() => {
    setLimitsOpen(false);
  }, []);

  return {
    summaryDeviceThreshold,
    limitsSaving,
    limitsOpen,
    limitsError,
    maxTemp,
    setMaxTemp,
    minTemp,
    setMinTemp,
    maxHumidity,
    setMaxHumidity,
    minHumidity,
    setMinHumidity,
    openLimitsDialog,
    handleLimitsConfirm,
    handleLimitsCancel,
  };
}
