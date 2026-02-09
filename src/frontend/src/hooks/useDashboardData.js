import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
import { getAlerts } from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";

export function useDashboardData(deviceId, refreshTick) {
  const { token } = useAuth();

  const [sensorData, setSensorData] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [device, setDevice] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!deviceId) {
      setSensorData([]);
      setAllAlerts([]);
      setDevice(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setDataLoading(true);
      setDataError("");

      try {
        const [sensor, alerts, dev] = await Promise.all([
          getSensorData(deviceId, token),
          getAlerts(deviceId, {}, token),
          getDevice(deviceId, token),
        ]);
        if (cancelled) return;

        setSensorData(Array.isArray(sensor) ? sensor : [sensor]);
        setAllAlerts(Array.isArray(alerts) ? alerts : []);
        setDevice(dev ?? null);
      } catch (err) {
        if (!cancelled) {
          console.error("Chyba při načítání dat dashboardu:", err);
          setDataError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání dat.",
          );
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId, token, refreshTick]);

  const activeAlerts = useMemo(
    () => allAlerts.filter((a) => a.active),
    [allAlerts],
  );

  return {
    sensorData,
    setSensorData,
    allAlerts,
    setAllAlerts,
    activeAlerts,
    device,
    setDevice,
    dataLoading,
    dataError,
  };
}
