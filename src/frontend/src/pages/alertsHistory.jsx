import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  TextField,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js";
import {
  getAlerts,
  resolveAlert,
  deleteAlert,
  restoreAlert,
} from "../services/alertService.js";
import AlertCard from "../components/AlertCard.jsx";
import AlertCardSkeleton from "../components/AlertCardSkeleton.jsx";
import AlertFilters from "../components/AlertFilters.jsx";
import AlertPagination from "../components/AlertPagination.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import ActionSelector from "../components/ActionSelector.jsx";
import PerPageSelector from "../components/PerPageSelector.jsx";
import { useTheme } from "@mui/material/styles";

export default function AlertsHistory() {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =====================
     DEVICES
  ====================== */
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  /* =====================
     ALERTS
  ====================== */
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteScope, setConfirmDeleteScope] = useState(null);
  const [deleteDateRange, setDeleteDateRange] = useState([null, null]);
  const [showDeleteCustomRange, setShowDeleteCustomRange] = useState(false);
  const [deleteCalendarOpenKey, setDeleteCalendarOpenKey] = useState(0);

  const [confirmMode, setConfirmMode] = useState(false);
  const [selectedConfirmIds, setSelectedConfirmIds] = useState(() => new Set());
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmConfirmScope, setConfirmConfirmScope] = useState(null);
  const [confirmDateRange, setConfirmDateRange] = useState([null, null]);
  const [showConfirmCustomRange, setShowConfirmCustomRange] = useState(false);
  const [confirmCalendarOpenKey, setConfirmCalendarOpenKey] = useState(0);

  /* =====================
     FILTERS
  ====================== */
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | resolved
  const [typeFilter, setTypeFilter] = useState("all"); // all | temperature | humidity | door | doorOpen
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD
  const [dateRange, setDateRange] = useState([null, null]);

  /* =====================
     PAGINATION
  ====================== */
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  /* =====================
     LOAD DEVICES
  ====================== */
  useEffect(() => {
    async function loadDevices() {
      try {
        const data = await getDevices(token);
        setDevices(data || []);
        if (data?.length && !selectedDeviceId) {
          setSelectedDeviceId(data[0]._id);
        }
      } catch (err) {
        setError("Nepodařilo se načíst zařízení.");
      }
    }

    loadDevices();
  }, [token]);

  /* =====================
     LOAD ALERTS (BY DEVICE)
  ====================== */
  useEffect(() => {
    if (!selectedDeviceId) return;

    let cancelled = false;

    async function loadAlerts() {
      try {
        setAlertsLoading(true);
        setError("");
        const data = await getAlerts(selectedDeviceId, {}, token);
        if (!cancelled) {
          setAlerts(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Nepodařilo se načíst historii výstrah.");
        }
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    }

    loadAlerts();
    setPage(1);

    return () => {
      cancelled = true;
    };
  }, [selectedDeviceId, token]);

  useEffect(() => {
    setDeleteMode(false);
    setSelectedIds(new Set());
    setDeleteDateRange([null, null]);
    setShowDeleteCustomRange(false);
    setConfirmMode(false);
    setSelectedConfirmIds(new Set());
    setConfirmDateRange([null, null]);
    setShowConfirmCustomRange(false);
  }, [selectedDeviceId]);

  /* =====================
     RESET PAGE ON FILTER CHANGE
  ====================== */
  useEffect(() => {
    setPage(1);
  }, [
    perPage,
    selectedDeviceId,
    dateFrom,
    dateTo,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    const [start, end] = dateRange;
    setDateFrom(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setDateTo(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  const applyQuickRange = (value) => {
    const now = new Date();
    let from = null;
    let to = null;

    if (value === "all") {
      setDateFrom("");
      setDateTo("");
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
    setDateFrom(fromDateValue);
    setDateTo(toDateValue);
    setDateRange([
      fromDateValue ? dayjs(fromDateValue) : null,
      toDateValue ? dayjs(toDateValue) : null,
    ]);
  };

  const handleResolve = async (alertId) => {
    try {
      setPendingIds((prev) => [...prev, alertId]);
      const resolved = await resolveAlert(alertId, token);
      setAlerts((prev) => prev.map((a) => (a._id === alertId ? resolved : a)));
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== alertId));
    }
  };

  const handleDeleteSelection = async (ids) => {
    if (!ids.length) return;
    try {
      setDeleteLoading(true);
      setPendingIds((prev) => [...new Set([...prev, ...ids])]);
      await Promise.all(ids.map((id) => deleteAlert(id, token)));
      setAlerts((prev) => prev.filter((a) => !ids.includes(a._id)));
      setSelectedIds(new Set());
      setDeleteMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Nepodařilo se smazat výstrahy.");
    } finally {
      setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
      setDeleteLoading(false);
    }
  };

  const handleResolveSelection = async (ids) => {
    if (!ids.length) return;
    try {
      setConfirmLoading(true);
      setPendingIds((prev) => [...new Set([...prev, ...ids])]);
      const resolvedAlerts = await Promise.all(
        ids.map((id) => resolveAlert(id, token)),
      );
      const byId = new Map(resolvedAlerts.map((a) => [a?._id, a]));
      setAlerts((prev) => prev.map((a) => byId.get(a._id) ?? a));
      setSelectedConfirmIds(new Set());
      setConfirmMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se potvrdit výstrahy.",
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => !ids.includes(id)));
      setConfirmLoading(false);
    }
  };

  const handleResolveRange = (value) => {
    if (value === "select") {
      setConfirmMode(true);
      return;
    }

    if (value === "custom") {
      setShowConfirmCustomRange(true);
      setConfirmCalendarOpenKey((k) => k + 1);
      return;
    }

    setShowConfirmCustomRange(false);

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
    const idsToResolve = alerts
      .filter((a) => Boolean(a.active))
      .filter((a) => {
        const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
        if (!ts) return false;
        if (fromTs != null && ts < fromTs) return false;
        return true;
      })
      .map((a) => a._id)
      .filter(Boolean);

    setConfirmConfirmScope({ type: "range", value, ids: idsToResolve });
  };

  const requestResolveSelected = () => {
    const ids = [...selectedConfirmIds].filter(Boolean);
    setConfirmConfirmScope({
      type: "selected",
      ids,
    });
  };

  const confirmResolve = async () => {
    if (!confirmConfirmScope?.ids?.length) {
      setConfirmConfirmScope(null);
      return;
    }
    await handleResolveSelection(confirmConfirmScope.ids);
    setConfirmConfirmScope(null);
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

  useEffect(() => {
    if (!showConfirmCustomRange) return;
    const [start, end] = confirmDateRange;
    if (!start || !end) return;

    const fromTs = dayjs(start).startOf("day").valueOf();
    const toTs = dayjs(end).endOf("day").valueOf();

    const idsToResolve = alerts
      .filter((a) => Boolean(a.active))
      .filter((a) => {
        const ts = a.timestamp ? new Date(a.timestamp).getTime() : null;
        if (!ts) return false;
        if (ts < fromTs) return false;
        if (ts > toTs) return false;
        return true;
      })
      .map((a) => a._id)
      .filter(Boolean);

    setConfirmConfirmScope({
      type: "range",
      value: "custom",
      ids: idsToResolve,
    });
  }, [confirmDateRange, showConfirmCustomRange, alerts]);

  const requestDeleteSelected = () => {
    const ids = [...selectedIds].filter(Boolean);
    setConfirmDeleteScope({
      type: "selected",
      ids,
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

  const handleRestore = async (alertId) => {
    try {
      setPendingIds((prev) => [...prev, alertId]);
      const restored = await restoreAlert(alertId, token);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? restored : a)),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Nepodařilo se obnovit výstrahu.");
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
  /* =====================
     FILTERING
  ====================== */
  const filteredAlerts = alerts.filter((alert) => {
    // ===== STATUS =====
    if (statusFilter === "active" && !alert.active) return false;
    if (statusFilter === "resolved" && alert.active) return false;

    // ===== TYPE =====
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;

    // ===== DATE FROM =====
    if (dateFrom) {
      const from = new Date(dateFrom);
      const alertDate = new Date(alert.timestamp);
      if (alertDate < from) return false;
    }

    // ===== DATE TO =====
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999); // celý den
      const alertDate = new Date(alert.timestamp);
      if (alertDate > to) return false;
    }

    return true;
  });

  /* =====================
     PAGINATION
  ====================== */
  const totalItems = filteredAlerts.length;
  const pagedAlerts = filteredAlerts.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <>
      <Box px={{ xs: 1, sm: 2, md: 3 }} py={2}>
        {/* HEADER */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h4">Historie výstrah</Typography>

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* DEVICE SELECTOR */}
            <Box
              sx={{
                minWidth: { xs: "100%", sm: 280 },
                p: 2,
                borderRadius: 3,
                backgroundColor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                },
              }}
            >
              <FormControl
                variant="standard"
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiInput-root": {
                    fontSize: "1rem",
                    fontWeight: 500,
                    "&:before": {
                      borderBottom: "none",
                    },
                    "&:after": {
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                    },
                    "&:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  },
                }}
              >
                <InputLabel id="device-select-label">Vyber zařízení</InputLabel>
                <Select
                  labelId="device-select-label"
                  value={selectedDeviceId ?? ""}
                  label="Vyber zařízení"
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {devices && devices.length > 0 ? (
                    devices.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} — {d.location}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      Žádná zařízení
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <ActionSelector
                type="resolve"
                selectionMode={confirmMode}
                selectedIds={selectedConfirmIds}
                loading={confirmLoading}
                onRangeSelect={handleResolveRange}
                onConfirmSelection={requestResolveSelected}
                onCancelSelection={() => {
                  setConfirmMode(false);
                  setSelectedConfirmIds(new Set());
                }}
              />

              <ActionSelector
                type="delete"
                selectionMode={deleteMode}
                selectedIds={selectedIds}
                loading={deleteLoading}
                onRangeSelect={handleDeleteRange}
                onConfirmSelection={requestDeleteSelected}
                onCancelSelection={() => {
                  setDeleteMode(false);
                  setSelectedIds(new Set());
                }}
              />

              {showConfirmCustomRange && !confirmMode && (
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="cs"
                  >
                    <DateRangeSingleCalendar
                      value={confirmDateRange}
                      onChange={setConfirmDateRange}
                      label="Od–do"
                      size="small"
                      fullWidth={isMobile}
                      autoOpenKey={confirmCalendarOpenKey}
                    />
                  </LocalizationProvider>
                </Box>
              )}

              {showDeleteCustomRange && !deleteMode && (
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="cs"
                  >
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
            </Box>

            <AlertFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onQuickRange={applyQuickRange}
            />
            {/* STATUS FILTER */}
            <TextField
              select
              size="small"
              label="Stav"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Vše</MenuItem>
              <MenuItem value="active">Nevyřešené</MenuItem>
              <MenuItem value="resolved">Vyřešené</MenuItem>
            </TextField>

            {/* TYPE FILTER */}
            <TextField
              select
              size="small"
              label="Typ"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">Vše</MenuItem>
              <MenuItem value="temperature">Teplota</MenuItem>
              <MenuItem value="humidity">Vlhkost</MenuItem>
              {/*  <MenuItem value="door">Dveře</MenuItem>*/}
              <MenuItem value="doorOpen"> Otevřené dveře</MenuItem>
            </TextField>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setDateFrom("");
                setDateTo("");
                setDateRange([null, null]);
              }}
            >
              Reset filtrů
            </Button>
            {/* PER PAGE */}
            <PerPageSelector
              value={perPage}
              onChange={setPerPage}
              options={[1, 5, 10, 20, 50]}
            />
          </Box>
        </Box>

        {/* ERROR */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* ALERTS LIST */}
        {alertsLoading ? (
          <Box px={3}>
            <AlertCardSkeleton count={Math.min(3, perPage)} />
          </Box>
        ) : pagedAlerts.length === 0 ? (
          <Typography>Žádné výstrahy pro zvolené filtry.</Typography>
        ) : (
          <Box
            px={3}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(auto-fill, minmax(320px, 1fr))",
              },
              gap: 2,
            }}
          >
            {pagedAlerts.map((alert) => (
              <Box
                key={alert._id}
                display="flex"
                alignItems="flex-start"
                gap={1}
                sx={{ minWidth: 0 }}
              >
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
                          if (e.target.checked) next.add(alert._id);
                          else next.delete(alert._id);
                          return next;
                        });
                      }}
                    />
                  </Box>
                )}
                {confirmMode && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                      pt: 1,
                    }}
                  >
                    <Checkbox
                      disabled={!alert.active}
                      checked={selectedConfirmIds.has(alert._id)}
                      onChange={(e) => {
                        if (!alert.active) return;
                        setSelectedConfirmIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(alert._id);
                          else next.delete(alert._id);
                          return next;
                        });
                      }}
                    />
                  </Box>
                )}
                {pendingIds.includes(alert._id) ? (
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <AlertCardSkeleton count={1} />
                  </Box>
                ) : (
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <AlertCard
                      alert={alert}
                      onResolve={() => handleResolve(alert._id)}
                      onRestore={() => handleRestore(alert._id)}
                      onDelete={() => openDeleteConfirm(alert._id)}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* PAGINATION */}
        <AlertPagination
          totalItems={totalItems}
          perPage={perPage}
          page={page}
          onPageChange={setPage}
        />

        <ConfirmDeleteDialog
          open={Boolean(confirmDeleteId)}
          onClose={closeDeleteConfirm}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />

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
                ? `Opravdu chcete smazat vybrané výstrahy? Po smazání se výstrahy nezobrazí v historii výstrah! (${confirmDeleteScope.ids.length})`
                : `Opravdu chcete smazat výstrahy pro zvolený rozsah? Po smazání se výstrahy nezobrazí v historii výstrah!(${confirmDeleteScope?.ids?.length ?? 0})`}
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

        <Dialog
          open={Boolean(confirmConfirmScope)}
          onClose={() => setConfirmConfirmScope(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Potvrdit výstrahy?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              {confirmConfirmScope?.type === "selected"
                ? `Opravdu chcete potvrdit vybrané výstrahy? (${confirmConfirmScope.ids.length})`
                : `Opravdu chcete potvrdit výstrahy pro zvolený rozsah? (${confirmConfirmScope?.ids?.length ?? 0})`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmConfirmScope(null)}>Zrušit</Button>
            <Button
              color="primary"
              variant="contained"
              onClick={confirmResolve}
              disabled={confirmLoading}
            >
              Potvrdit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
