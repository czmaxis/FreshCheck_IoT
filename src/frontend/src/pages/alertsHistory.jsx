import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import dayjs from "dayjs";
import NavBar from "./navBar.jsx";
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
import AlertActions from "../components/AlertActions.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";

export default function AlertsHistory() {
  const { token } = useAuth();

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
      <NavBar />

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
            <FormControl variant="standard" sx={{ minWidth: 220 }}>
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
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" whiteSpace="nowrap">
                Na stránce
              </Typography>

              <TextField
                select
                size="small"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                sx={{ minWidth: 80 }}
              >
                {[1, 5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
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
                        isResolved={!alert.active}
                        onResolve={() => handleResolve(alert._id)}
                        onRestore={() => handleRestore(alert._id)}
                        onDelete={() => openDeleteConfirm(alert._id)}
                      />
                    }
                  />
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
      </Box>
    </>
  );
}
