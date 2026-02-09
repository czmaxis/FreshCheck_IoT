import { useState, useEffect, useCallback } from "react";
import {
  getAlertIdsInRange,
  getAlertIdsInCustomRange,
} from "../utils/dateRangeUtils.js";

export function useBulkActions(
  alerts,
  onExecute,
  { activeOnly = false } = {},
) {
  const [mode, setMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [confirmScope, setConfirmScope] = useState(null);
  const [customDateRange, setCustomDateRange] = useState([null, null]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [calendarOpenKey, setCalendarOpenKey] = useState(0);

  const handleRange = useCallback(
    (value) => {
      if (value === "select") {
        setMode(true);
        return;
      }
      if (value === "custom") {
        setShowCustomRange(true);
        setCalendarOpenKey((k) => k + 1);
        return;
      }
      setShowCustomRange(false);
      const ids = getAlertIdsInRange(alerts, value, { activeOnly });
      setConfirmScope({ type: "range", value, ids });
    },
    [alerts, activeOnly],
  );

  useEffect(() => {
    if (!showCustomRange) return;
    const [start, end] = customDateRange;
    if (!start || !end) return;
    const ids = getAlertIdsInCustomRange(alerts, start, end, { activeOnly });
    setConfirmScope({ type: "range", value: "custom", ids });
  }, [customDateRange, showCustomRange, alerts, activeOnly]);

  const requestSelected = useCallback(() => {
    setConfirmScope({ type: "selected", ids: [...selectedIds] });
  }, [selectedIds]);

  const confirmAction = useCallback(async () => {
    if (!confirmScope?.ids?.length) {
      setConfirmScope(null);
      return;
    }
    try {
      setLoading(true);
      await onExecute(confirmScope.ids);
      setSelectedIds(new Set());
      setMode(false);
    } finally {
      setLoading(false);
      setConfirmScope(null);
    }
  }, [confirmScope, onExecute]);

  const cancelMode = useCallback(() => {
    setMode(false);
    setSelectedIds(new Set());
  }, []);

  const resetAll = useCallback(() => {
    setMode(false);
    setSelectedIds(new Set());
    setCustomDateRange([null, null]);
    setShowCustomRange(false);
  }, []);

  return {
    mode,
    selectedIds,
    setSelectedIds,
    loading,
    confirmScope,
    setConfirmScope,
    customDateRange,
    setCustomDateRange,
    showCustomRange,
    calendarOpenKey,
    handleRange,
    requestSelected,
    confirmAction,
    cancelMode,
    resetAll,
  };
}
