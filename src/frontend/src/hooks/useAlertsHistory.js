import { useEffect, useState, useCallback } from "react";
import {
  getAlerts,
  resolveAlert,
  deleteAlert,
  restoreAlert,
} from "../services/alertService.js";
import { getDevices } from "../services/deviceService.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useAlertsHistory() {
  const { token } = useAuth();

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const data = await getDevices(token);
        setDevices(data || []);
        if (data?.length && !selectedDeviceId) {
          setSelectedDeviceId(data[0]._id);
        }
      } catch {
        setError("Nepodařilo se načíst zařízení.");
      }
    }
    loadDevices();
  }, [token]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    let cancelled = false;

    async function loadAlerts() {
      try {
        setAlertsLoading(true);
        setError("");
        const data = await getAlerts(selectedDeviceId, {}, token);
        if (!cancelled) setAlerts(data || []);
      } catch {
        if (!cancelled) setError("Nepodařilo se načíst historii výstrah.");
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    }

    loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [selectedDeviceId, token]);

  const handleResolve = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        const resolved = await resolveAlert(alertId, token);
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? resolved : a)),
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token],
  );

  const handleDelete = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        await deleteAlert(alertId, token);
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token],
  );

  const handleRestore = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        const restored = await restoreAlert(alertId, token);
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? restored : a)),
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se obnovit výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token],
  );

  const handleDeleteSelection = useCallback(
    async (ids, onProgress) => {
      if (!ids.length) return;
      const BATCH = 10;
      let done = 0;
      try {
        setPendingIds((prev) => [...new Set([...prev, ...ids])]);
        for (let i = 0; i < ids.length; i += BATCH) {
          const batch = ids.slice(i, i + BATCH);
          await Promise.all(batch.map((id) => deleteAlert(id, token)));
          done += batch.length;
          onProgress?.({ done, total: ids.length });
        }
        setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahy.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    },
    [token],
  );

  const handleResolveSelection = useCallback(
    async (ids, onProgress) => {
      if (!ids.length) return;
      const BATCH = 10;
      let done = 0;
      const resolvedAlerts = [];
      try {
        setPendingIds((prev) => [...new Set([...prev, ...ids])]);
        for (let i = 0; i < ids.length; i += BATCH) {
          const batch = ids.slice(i, i + BATCH);
          const results = await Promise.all(
            batch.map((id) => resolveAlert(id, token)),
          );
          resolvedAlerts.push(...results);
          done += batch.length;
          onProgress?.({ done, total: ids.length });
        }
        const byId = new Map(resolvedAlerts.map((a) => [a?._id, a]));
        setAlerts((prev) => prev.map((a) => byId.get(a._id) ?? a));
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se potvrdit výstrahy.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    },
    [token],
  );

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    alerts,
    alertsLoading,
    error,
    setError,
    pendingIds,
    handleResolve,
    handleDelete,
    handleRestore,
    handleDeleteSelection,
    handleResolveSelection,
  };
}
