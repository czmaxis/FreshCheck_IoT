import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  TextField,
  Checkbox,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import AlertCard from "../components/AlertCard.jsx";
import AlertFilters from "../components/AlertFilters.jsx";
import AlertPagination from "../components/AlertPagination.jsx";
import AlertActions from "../components/AlertActions.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import AlertCardSkeleton from "../components/AlertCardSkeleton.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getAlerts, resolveAlert, deleteAlert } from "../services/alertService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "@mui/material/styles";

export default function Alerts({ deviceId, refreshKey }) {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmBulkAction, setConfirmBulkAction] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteScope, setConfirmDeleteScope] = useState(null);
  const [deleteDateRange, setDeleteDateRange] = useState([null, null]);
  const [showDeleteCustomRange, setShowDeleteCustomRange] = useState(false);
  const [deleteCalendarOpenKey, setDeleteCalendarOpenKey] = useState(0);

  const DELETE_OPTIONS = [
    { label: "Smazat za poslední hodinu", value: "1h" },
    { label: "Smazat za posledních 6 hodin", value: "6h" },
    { label: "Smazat za posledních 24 hodin", value: "24h" },
    { label: "Smazat za poslední týden", value: "7d" },
    { label: "Smazat vše", value: "all" },
    { label: "Označit a smazat", value: "select" },
    { label: "Od–do", value: "custom" },
  ];

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
  }, [deviceId, token, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [deviceId, perPage]);

  useEffect(() => {
    setDeleteMode(false);
    setSelectedIds(new Set());
    setDeleteDateRange([null, null]);
    setShowDeleteCustomRange(false);
  }, [deviceId]);

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

  const handleResolveAll = async () => {
    const ids = alerts.map((a) => a._id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      setPendingIds((prev) => [...prev, ...ids]);
      await Promise.all(ids.map((id) => resolveAlert(id, token)));
      setAlerts([]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Nepodařilo se potvrdit všechny výstrahy.",
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleDeleteAll = async () => {
    const ids = alerts.map((a) => a._id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      setPendingIds((prev) => [...prev, ...ids]);
      await Promise.all(ids.map((id) => deleteAlert(id, token)));
      setAlerts([]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se smazat všechny výstrahy.",
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleDeleteSelection = async (ids) => {
    if (!ids.length) return;
    try {
      setDeleteLoading(true);
      await Promise.all(ids.map((id) => deleteAlert(id, token)));
      setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
      setSelectedIds(new Set());
      setDeleteMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se smazat výstrahy.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteRange = (value) => {
    if (value === "select") {
      setDeleteMode(true);
      return;
    }

    if (value === "custom") {
      setShowDeleteCustomRange(true);
      setDeleteCalendarOpenKey((k) => k + 1);
      return;
    }

    setShowDeleteCustomRange(false);

    const now = new Date();
    let from = null;
    if (value === "1h") {
      from = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (value === "6h") {
      from = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    } else if (value === "24h") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (value === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (value === "all") {
      from = null;
    }

    const fromTs = from ? from.getTime() : null;
    const idsToDelete = alerts
      .filter((a) => {
        const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
        if (!ts) return false;
        if (fromTs != null && ts < fromTs) return false;
        return true;
      })
      .map((a) => a._id)
      .filter(Boolean);

    setConfirmDeleteScope({ type: "range", value, ids: idsToDelete });
  };

  useEffect(() => {
    if (!showDeleteCustomRange) return;
    const [start, end] = deleteDateRange;
    if (!start || !end) return;

    const fromTs = dayjs(start).startOf("day").valueOf();
    const toTs = dayjs(end).endOf("day").valueOf();

    const idsToDelete = alerts
      .filter((a) => {
        const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
        if (!ts) return false;
        if (ts < fromTs) return false;
        if (ts > toTs) return false;
        return true;
      })
      .map((a) => a._id)
      .filter(Boolean);

    setConfirmDeleteScope({ type: "range", value: "custom", ids: idsToDelete });
  }, [deleteDateRange, showDeleteCustomRange, alerts]);

  const requestDeleteSelected = () => {
    setConfirmDeleteScope({
      type: "selected",
      ids: [...selectedIds],
    });
  };

  const confirmDelete = async () => {
    if (!confirmDeleteScope?.ids?.length) {
      setConfirmDeleteScope(null);
      return;
    }
    await handleDeleteSelection(confirmDeleteScope.ids);
    setConfirmDeleteScope(null);
  };

  const confirmBulk = async () => {
    try {
      if (confirmBulkAction === "resolve") {
        await handleResolveAll();
      } else if (confirmBulkAction === "delete") {
        await handleDeleteAll();
      }
    } finally {
      setConfirmBulkAction(null);
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
  const pagedAlerts = filteredAlerts.slice((page - 1) * perPage, page * perPage);

  return (
    <Box
      width="100%"
      mb={3}
      sx={{ maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box
        p={{ xs: 1.5, sm: 3 }}
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={1}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="h5" mr={{ xs: 0, sm: 1 }}>
            Výstrahy
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => setConfirmBulkAction("resolve")}
            disabled={alerts.length === 0 || pendingIds.length > 0}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Potvrdit vše
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setConfirmBulkAction("delete")}
            disabled={alerts.length === 0 || pendingIds.length > 0}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Smazat vše
          </Button>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {!deleteMode ? (
              <TextField
                select
                size="small"
                label="Smazat"
                value=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  handleDeleteRange(value);
                }}
                sx={{ minWidth: 180, width: { xs: "100%", sm: 200 } }}
              >
                {DELETE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={requestDeleteSelected}
                  disabled={selectedIds.size === 0 || deleteLoading}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Smazat
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setDeleteMode(false);
                    setSelectedIds(new Set());
                  }}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Zrušit
                </Button>
              </Box>
            )}
          </Box>

          {showDeleteCustomRange && !deleteMode && (
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
                <DateRangeSingleCalendar
                  value={deleteDateRange}
                  onChange={setDeleteDateRange}
                  label="Od–do"
                  size="small"
                  fullWidth={isMobile}
                  autoOpenKey={deleteCalendarOpenKey}
                />
              </LocalizationProvider>
            </Box>
          )}

          <AlertFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
          />

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Typography variant="body2">Na stránce</Typography>
            <TextField
              select
              size="small"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              sx={{ minWidth: 60, width: { xs: "100%", sm: 80 } }}
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
            sx={{ width: { xs: "100%", sm: "auto" } }}
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
        <Box px={{ xs: 1.5, sm: 3 }}>
          {pagedAlerts.map((alert) => (
            <Box key={alert._id} display="flex" alignItems="flex-start" gap={1}>
              {deleteMode && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                    pt: 1,
                  }}
                >
                  <Checkbox
                    checked={selectedIds.has(alert._id)}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(alert._id);
                        } else {
                          next.delete(alert._id);
                        }
                        return next;
                      });
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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

      <Dialog
        open={Boolean(confirmBulkAction)}
        onClose={() => setConfirmBulkAction(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmBulkAction === "delete"
            ? "Smazat všechny výstrahy?"
            : "Potvrdit všechny výstrahy?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmBulkAction === "delete"
              ? "Smažete všechny aktuální výstrahy pro toto zařízení. Opravdu pokračovat?"
              : "Potvrdíte všechny aktuální výstrahy pro toto zařízení. Opravdu pokračovat?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkAction(null)}>Zrušit</Button>
          <Button
            variant="contained"
            color={confirmBulkAction === "delete" ? "error" : "primary"}
            onClick={confirmBulk}
          >
            {confirmBulkAction === "delete" ? "Smazat vše" : "Potvrdit vše"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(confirmDeleteScope)}
        onClose={() => setConfirmDeleteScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat výstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDeleteScope?.type === "selected"
              ? `Opravdu chcete smazat vybrané výstrahy? (${confirmDeleteScope.ids.length})`
              : `Opravdu chcete smazat výstrahy pro zvolený rozsah? (${confirmDeleteScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteScope(null)}>Zrušit</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



