import { useEffect, useState, useCallback } from "react";
import { resolveAlert, deleteAlert } from "../services/alertService.js";
import { useAuth } from "../context/AuthContext.jsx";

export function useAlerts(activeAlerts, setAllAlerts) {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    setAlerts(activeAlerts || []);
  }, [activeAlerts]);

  const handleResolve = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        await resolveAlert(alertId, token);
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        setAllAlerts((prev) =>
          prev.map((a) =>
            a._id === alertId
              ? { ...a, active: false, resolvedAt: new Date().toISOString() }
              : a,
          ),
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token, setAllAlerts],
  );

  const handleDelete = useCallback(
    async (alertId) => {
      try {
        setPendingIds((prev) => [...prev, alertId]);
        await deleteAlert(alertId, token);
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
        setAllAlerts((prev) => prev.filter((a) => a._id !== alertId));
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahu.",
        );
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== alertId));
      }
    },
    [token, setAllAlerts],
  );

  const handleDeleteSelection = useCallback(
    async (ids) => {
      if (!ids.length) return;
      try {
        await Promise.all(ids.map((id) => deleteAlert(id, token)));
        setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
        setAllAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se smazat výstrahy.",
        );
      }
    },
    [token, setAllAlerts],
  );

  const handleResolveSelection = useCallback(
    async (ids) => {
      if (!ids.length) return;
      try {
        await Promise.all(ids.map((id) => resolveAlert(id, token)));
        setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
        setAllAlerts((prev) =>
          prev.map((a) =>
            ids.includes(a._id)
              ? { ...a, active: false, resolvedAt: new Date().toISOString() }
              : a,
          ),
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Nepodařilo se potvrdit výstrahy.",
        );
      }
    },
    [token, setAllAlerts],
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
