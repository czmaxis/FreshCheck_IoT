import { useState, useMemo, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js";
import { createSensorData } from "../services/sensorDataService.js";
import { generateMockData } from "../utils/mockDataUtils.js";

export function useMockDataGenerator() {
  const { token } = useAuth();

  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [count, setCount] = useState(100);
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(7, "day"));
  const [dateTo, setDateTo] = useState(dayjs());
  const [tempRange, setTempRange] = useState([2, 8]);
  const [humRange, setHumRange] = useState([40, 80]);
  const [doorOpenChance, setDoorOpenChance] = useState(5);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    setDevicesLoading(true);
    getDevices(token)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.devices || [];
        setDevices(list);
        if (list.length > 0) setSelectedDeviceId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => active && setDevicesLoading(false));
    return () => { active = false; };
  }, [token]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d._id === selectedDeviceId),
    [devices, selectedDeviceId]
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedDeviceId) return;

    setResult(null);
    setSaving(true);
    setProgress(0);

    const data = generateMockData(
      count,
      dateFrom,
      dateTo,
      tempRange[0],
      tempRange[1],
      humRange[0],
      humRange[1],
      doorOpenChance / 100,
      selectedDeviceId
    );

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        await createSensorData(data[i], token);
        saved++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / data.length) * 100));
    }

    setSaving(false);

    if (failed === 0) {
      setResult({
        type: "success",
        message: `Úspěšně vygenerováno a uloženo ${saved} záznamů pro zařízení „${selectedDevice?.name || selectedDeviceId}".`,
      });
    } else {
      setResult({
        type: failed === data.length ? "error" : "warning",
        message: `Uloženo ${saved} z ${data.length} záznamů. ${failed} záznamů se nepodařilo uložit.`,
      });
    }
  }, [count, dateFrom, dateTo, tempRange, humRange, doorOpenChance, selectedDeviceId, selectedDevice, token]);

  return {
    devices,
    devicesLoading,
    selectedDeviceId,
    setSelectedDeviceId,
    count,
    setCount,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    tempRange,
    setTempRange,
    humRange,
    setHumRange,
    doorOpenChance,
    setDoorOpenChance,
    saving,
    progress,
    result,
    setResult,
    handleGenerate,
  };
}
