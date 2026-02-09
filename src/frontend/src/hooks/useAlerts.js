import { useEffect, useState, useCallback } from "react";
import {
  getAlerts,
  resolveAlert,
  deleteAlert,
} from "../services/alertService.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useAlerts(
  deviceId,
  refreshKey,
  fetchOptions = { active: true },
  onAlertsChanged,
) {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const data = await getAlerts(deviceId, fetchOptions, token);
        if (!cancelled) setAlerts(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err.response?.data?.message || "Nepodařilo se načíst výstrahy.",
          );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId, token, refreshKey]);

  const handleResolve = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        await resolveAlert(alertId, token);
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        onAlertsChanged?.();
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token, onAlertsChanged],
  );

  const handleDelete = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        await deleteAlert(alertId, token);
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        onAlertsChanged?.();
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token, onAlertsChanged],
  );

  const handleDeleteSelection = useCallback(
    async (ids) => {
      if (!ids.length) return;
      try {
        await Promise.all(ids.map((id) => deleteAlert(id, token)));
        setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
        onAlertsChanged?.();
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahy.",
        );
      }
    },
    [token, onAlertsChanged],
  );

  const handleResolveSelection = useCallback(
    async (ids) => {
      if (!ids.length) return;
      try {
        await Promise.all(ids.map((id) => resolveAlert(id, token)));
        setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
        onAlertsChanged?.();
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se potvrdit výstrahy.",
        );
      }
    },
    [token, onAlertsChanged],
  );

  return {
    alerts,
    setAlerts,
    error,
    setError,
    pendingIds,
    handleResolve,
    handleDelete,
    handleDeleteSelection,
    handleResolveSelection,
  };
}
