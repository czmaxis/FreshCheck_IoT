import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  MenuItem,
  TextField,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import dayjs from "dayjs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  getAlerts,
  resolveAlert,
  deleteAlert,
} from "../services/alertService.js";
import { getDevice } from "../services/deviceService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Alerts({ deviceId }) {
  const { token } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [deviceThreshold, setDeviceThreshold] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);

  const QUICK_RANGES = [
    { label: "1h", value: "1h" },
    { label: "6h", value: "6h" },
    { label: "24h", value: "24h" },
    { label: "Včera", value: "yesterday" },
    { label: "Tento týden", value: "thisWeek" },
    { label: "7d", value: "7d" },
    { label: "Vše", value: "all" },
  ];

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    async function load() {
      try {
        setError("");
        const [data, device] = await Promise.all([
          getAlerts(deviceId, { active: true }, token),
          getDevice(deviceId, token),
        ]);
        if (!cancelled) {
          setAlerts(data);
          setDeviceThreshold(device?.threshold ?? null);
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
      await resolveAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se vyřešit výstrahu.",
      );
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await deleteAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Nepodařilo se smazat výstrahu.");
    }
  };

  const openDeleteConfirm = (alertId) => {
    setConfirmDeleteId(alertId);
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteId(null);
  };

  const getTypeLabel = (alert) => {
    switch (alert.type) {
      case "humidity":
        return "Vlhkost";
      case "temperature":
        return "Teplota";
      case "door":
        return "Dveře";
      default:
        return alert.type || "Výstraha";
    }
  };

  const getTitle = (alert) => {
    const value = alert.value;
    const min =
      alert.threshold?.[alert.type]?.min ??
      alert.threshold?.min ??
      deviceThreshold?.[alert.type]?.min ??
      deviceThreshold?.min ??
      null;
    const max =
      alert.threshold?.[alert.type]?.max ??
      alert.threshold?.max ??
      deviceThreshold?.[alert.type]?.max ??
      deviceThreshold?.max ??
      null;

    if (alert.type === "humidity") {
      if (min != null && value < min) return "Nízká vlhkost";
      if (max != null && value > max) return "Vysoká vlhkost";
      return "Výstraha vlhkosti";
    }

    if (alert.type === "temperature") {
      if (min != null && value < min) return "Nízká teplota";
      if (max != null && value > max) return "Vysoká teplota";
      return "Výstraha teploty";
    }

    if (alert.type === "door") {
      return "Dveře otevřeny";
    }

    return "Výstraha";
  };

  const formatValue = (alert) => {
    if (alert.type === "humidity") {
      const min =
        alert.threshold?.humidity?.min ??
        alert.threshold?.min ??
        deviceThreshold?.humidity?.min ??
        deviceThreshold?.min ??
        null;
      const max =
        alert.threshold?.humidity?.max ??
        alert.threshold?.max ??
        deviceThreshold?.humidity?.max ??
        deviceThreshold?.max ??
        null;
      const limitText =
        min != null && max != null
          ? ` (limit ${min}–${max} %)`
          : min != null
            ? ` (limit ${min} %)`
            : max != null
              ? ` (limit ${max} %)`
              : "";
      return `💧 ${alert.value ?? "-"} %${limitText}`;
    }
    if (alert.type === "temperature") {
      const min =
        alert.threshold?.temperature?.min ??
        alert.threshold?.min ??
        deviceThreshold?.temperature?.min ??
        deviceThreshold?.min ??
        null;
      const max =
        alert.threshold?.temperature?.max ??
        alert.threshold?.max ??
        deviceThreshold?.temperature?.max ??
        deviceThreshold?.max ??
        null;
      const limitText =
        min != null && max != null
          ? ` (limit ${min}–${max} °C)`
          : min != null
            ? ` (limit ${min} °C)`
            : max != null
              ? ` (limit ${max} °C)`
              : "";
      return `🌡 ${alert.value ?? "-"} °C${limitText}`;
    }
    if (alert.type === "door") {
      return `🚪 ${alert.value ?? "-"} s`;
    }
    return `${alert.value ?? "-"}`;
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
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const pagedAlerts = filteredAlerts.slice(
    (page - 1) * perPage,
    page * perPage
  );
  const startIndex = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(page * perPage, totalItems);

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

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
              <DateRangeSingleCalendar
                value={dateRange}
                onChange={setDateRange}
                label="Od–do"
                size="small"
              />
            </LocalizationProvider>

            <ButtonGroup size="small" variant="outlined">
              {QUICK_RANGES.map((r) => (
                <Button key={r.value} onClick={() => applyQuickRange(r.value)}>
                  {r.label}
                </Button>
              ))}
            </ButtonGroup>

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
            <Box
              key={alert._id}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                border: "1px solid #f2c2a2",
                backgroundColor: "#fff7f0",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  ⚠️ {getTitle(alert)}
                </Typography>
                <Chip
                  size="small"
                  label={getTypeLabel(alert)}
                  sx={{
                    backgroundColor: "#ffe2cc",
                    color: "#7a3b00",
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Typography sx={{ mb: 0.5 }}>{formatValue(alert)}</Typography>
              <Typography variant="body2" color="text.secondary">
                🕒 {new Date(alert.timestamp).toLocaleString("cs-CZ")}
              </Typography>

              <Box display="flex" gap={1.5} mt={1.5}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleResolve(alert._id)}
                >
                  Potvrdit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => openDeleteConfirm(alert._id)}
                >
                  smazat
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {visible && totalItems > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            mt: 2,
            px: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Zobrazeno {startIndex}–{endIndex} z {totalItems} záznamů
          </Typography>

          {totalPages > 1 && (
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                ⏮ První
              </Button>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                ⏭ Poslední
              </Button>
            </Box>
          )}
        </Box>
      )}

      {!visible && (
        <Typography variant="body2" color="text.secondary">
          Výstrahy jsou skryté.
        </Typography>
      )}

      <Dialog
        open={Boolean(confirmDeleteId)}
        onClose={closeDeleteConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat výstrahu?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Po smazání se výstraha nezobrazí v historii výstrah. Opravdu chcete
            výstrahu smazat?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>Zrušit</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDelete(confirmDeleteId)}
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
