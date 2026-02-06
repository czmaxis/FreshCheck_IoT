import React, { useEffect, useState } from "react";
import { Box, Typography, Button, MenuItem, TextField } from "@mui/material";
import dayjs from "dayjs";
import AlertCard from "../components/AlertCard.jsx";
import AlertFilters from "../components/AlertFilters.jsx";
import AlertPagination from "../components/AlertPagination.jsx";
import AlertActions from "../components/AlertActions.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import AlertCardSkeleton from "../components/AlertCardSkeleton.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  getAlerts,
  resolveAlert,
  deleteAlert,
} from "../services/alertService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Alerts({ deviceId }) {
  const { token } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    async function load() {
      try {
        setError("");
        const data = await getAlerts(deviceId, { active: true }, token);
        if (!cancelled) {
          setAlerts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Nepodařilo se načíst výstrahy.",
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId, token]);

  useEffect(() => {
    setPage(1);
  }, [deviceId, perPage]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  const applyQuickRange = (value) => {
    const now = new Date();
    let from = null;
    let to = null;

    if (value === "all") {
      setFromDate("");
      setToDate("");
      return;
    }

    if (value === "1h") {
      from = new Date(now.getTime() - 60 * 60 * 1000);
      to = now;
    } else if (value === "6h") {
      from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      to = now;
    } else if (value === "24h") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      to = now;
    } else if (value === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      to = now;
    } else if (value === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (value === "thisWeek") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - (day - 1));
      from = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0,
      );
      to = now;
    }

    const toDateValue = to ? to.toISOString().slice(0, 10) : "";
    const fromDateValue = from ? from.toISOString().slice(0, 10) : "";
    setFromDate(fromDateValue);
    setToDate(toDateValue);
    setDateRange([
      fromDateValue ? dayjs(fromDateValue) : null,
      toDateValue ? dayjs(toDateValue) : null,
    ]);
  };

  const handleResolve = async (alertId) => {
    try {
      setPendingIds((prev) => [...prev, alertId]);
      await resolveAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== alertId));
    }
  };

  const handleDelete = async (alertId) => {
    try {
      setPendingIds((prev) => [...prev, alertId]);
      await deleteAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Nepodařilo se smazat výstrahu.");
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== alertId));
    }
  };

  const openDeleteConfirm = (alertId) => {
    setConfirmDeleteId(alertId);
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteId(null);
  };

  if (alerts.length === 0) return null;

  const filteredAlerts = alerts.filter((a) => {
    const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
    if (!ts) return false;
    if (fromDate) {
      const fromTs = new Date(fromDate).setHours(0, 0, 0, 0);
      if (ts < fromTs) return false;
    }
    if (toDate) {
      const toTs = new Date(toDate).setHours(23, 59, 59, 999);
      if (ts > toTs) return false;
    }
    return true;
  });

  const totalItems = filteredAlerts.length;
  const pagedAlerts = filteredAlerts.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <Box width="100%" mb={3}>
      <Box
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="h5" mr={1}>
          Výstrahy
        </Typography>

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <AlertFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
          />

          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">Na stránce</Typography>
            <TextField
              select
              size="small"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              sx={{
                minWidth: 60,
              }}
            >
              {[1, 5, 10, 20].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Button
            size="small"
            variant="outlined"
            onClick={() => setVisible((v) => !v)}
            startIcon={visible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {visible ? "Skrýt" : "Zobrazit"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {visible && (
        <Box px={3}>
          {pagedAlerts.map((alert) => (
            <Box key={alert._id}>
              {pendingIds.includes(alert._id) ? (
                <AlertCardSkeleton count={1} />
              ) : (
                <AlertCard
                  alert={alert}
                  actions={
                    <AlertActions
                      isResolved={false}
                      onResolve={() => handleResolve(alert._id)}
                      onRestore={() => {}}
                      onDelete={() => openDeleteConfirm(alert._id)}
                    />
                  }
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {visible && (
        <AlertPagination
          totalItems={totalItems}
          perPage={perPage}
          page={page}
          onPageChange={setPage}
        />
      )}

      {!visible && (
        <Typography variant="body2" color="text.secondary">
          Výstrahy jsou skryté.
        </Typography>
      )}

      <ConfirmDeleteDialog
        open={Boolean(confirmDeleteId)}
        onClose={closeDeleteConfirm}
        onConfirm={() => handleDelete(confirmDeleteId)}
      />
    </Box>
  );
}
