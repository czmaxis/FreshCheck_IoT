import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteSensorData } from "../services/sensorDataService.js";

export function useSensorDelete(deviceId, data, setData, setError) {
  const { token } = useAuth();

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteScope, setConfirmDeleteScope] = useState(null);
  const [deleteDateRange, setDeleteDateRange] = useState([null, null]);
  const [showDeleteCustomRange, setShowDeleteCustomRange] = useState(false);
  const [deleteCalendarOpenKey, setDeleteCalendarOpenKey] = useState(0);

  useEffect(() => {
    setDeleteMode(false);
    setSelectedIds(new Set());
    setDeleteDateRange([null, null]);
    setShowDeleteCustomRange(false);
  }, [deviceId]);

  const handleDeleteSelection = useCallback(
    async (ids) => {
      if (!deviceId || ids.length === 0) return;
      try {
        setDeleteLoading(true);
        await Promise.all(ids.map((id) => deleteSensorData(id, token)));
        setData((prev) => prev.filter((item) => !ids.includes(item._id)));
        setSelectedIds(new Set());
        setDeleteMode(false);
      } catch (err) {
        console.error("Chyba při mazání dat:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Nepodařilo se smazat data.",
        );
      } finally {
        setDeleteLoading(false);
      }
    },
    [deviceId, token, setData, setError],
  );

  const handleDeleteRange = useCallback(
    (value) => {
      if (value === "select") {
        setDeleteMode(true);
        return;
      }

      if (!deviceId) return;

      if (value === "custom") {
        setShowDeleteCustomRange(true);
        setDeleteCalendarOpenKey((k) => k + 1);
        return;
      }

      setShowDeleteCustomRange(false);

      const diffMap = {
        "1h": 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
      };

      const fromTs = value === "all" ? null : Date.now() - diffMap[value];

      const idsToDelete = data
        .filter((item) => {
          const ts = item.timestamp
            ? new Date(item.timestamp).getTime()
            : null;
          if (!ts) return false;
          if (fromTs != null && ts < fromTs) return false;
          return true;
        })
        .map((item) => item._id)
        .filter(Boolean);

      setConfirmDeleteScope({ type: "range", value, ids: idsToDelete });
    },
    [deviceId, data],
  );

  useEffect(() => {
    if (!showDeleteCustomRange) return;
    const [start, end] = deleteDateRange;
    if (!start || !end) return;

    const fromTs = dayjs(start).startOf("day").valueOf();
    const toTs = dayjs(end).endOf("day").valueOf();

    const idsToDelete = data
      .filter((item) => {
        const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
        if (!ts) return false;
        if (ts < fromTs) return false;
        if (ts > toTs) return false;
        return true;
      })
      .map((item) => item._id)
      .filter(Boolean);

    setConfirmDeleteScope({ type: "range", value: "custom", ids: idsToDelete });
  }, [deleteDateRange, showDeleteCustomRange, data]);

  const requestDeleteSelected = useCallback(() => {
    setConfirmDeleteScope({
      type: "selected",
      ids: [...selectedIds],
    });
  }, [selectedIds]);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteScope?.ids?.length) {
      setConfirmDeleteScope(null);
      return;
    }
    await handleDeleteSelection(confirmDeleteScope.ids);
    setConfirmDeleteScope(null);
  }, [confirmDeleteScope, handleDeleteSelection]);

  const cancelDeleteMode = useCallback(() => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  }, []);

  return {
    deleteMode,
    selectedIds,
    setSelectedIds,
    deleteLoading,
    confirmDeleteScope,
    setConfirmDeleteScope,
    deleteDateRange,
    setDeleteDateRange,
    showDeleteCustomRange,
    deleteCalendarOpenKey,
    handleDeleteRange,
    requestDeleteSelected,
    confirmDelete,
    cancelDeleteMode,
  };
}
