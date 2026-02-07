import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Checkbox,
  IconButton,
  Collapse,
  MenuItem,
  Pagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import dayjs from "dayjs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import TimeRangeSelector from "../components/TimeRangeSelector.jsx";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData, deleteSensorData } from "../services/sensorDataService.js";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import { useTheme, useMediaQuery } from "@mui/material";

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours() + 1).padStart(2, "0"); // +1 to temporary fix timezone issue in CZ
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function getDoorState(illuminance) {
  if (illuminance === undefined || illuminance === null) {
    return { label: "—", color: "default" };
  }

  if (Number(illuminance) === 0) {
    return { label: "Zavřeno", color: "success" };
  }

  return { label: "Otevřeno", color: "warning" };
}

export default function SensorData({ deviceId, refreshKey }) {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteScope, setConfirmDeleteScope] = useState(null);
  const [deleteDateRange, setDeleteDateRange] = useState([null, null]);
  const [showDeleteCustomRange, setShowDeleteCustomRange] = useState(false);
  const [deleteCalendarOpenKey, setDeleteCalendarOpenKey] = useState(0);

  // single collapse/expand state for the whole block
  const [expanded, setExpanded] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // date filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
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
    // reset paging and expanded state when device changes
    setPage(1);
    setExpanded(true);
    setDeleteMode(false);
    setSelectedIds(new Set());
    setDeleteDateRange([null, null]);
    setShowDeleteCustomRange(false);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const resp = await getSensorData(deviceId, token);
        const arr = Array.isArray(resp) ? resp : [resp];
        if (!cancelled) setData(arr);
      } catch (err) {
        console.error("Chyba při načítání sensor dat:", err);
        if (!cancelled)
          setError(
            err.response?.data?.message ||
              err.message ||
              "Chyba při načítání sensor dat.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [deviceId, token, refreshKey]);

  useEffect(() => {
    const [start, end] = dateRange;
    setFromDate(start ? dayjs(start).format("YYYY-MM-DD") : "");
    setToDate(end ? dayjs(end).format("YYYY-MM-DD") : "");
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);

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

  const filteredData = data.filter((d) => {
    const ts = d.timestamp ? new Date(d.timestamp).getTime() : null;
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

  // pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const toggleExpandAll = () => {
    setExpanded((v) => !v);
  };

  const handleDeleteSelection = async (ids) => {
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
  };

  const handleDeleteRange = async (value) => {
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

    let from = null;
    const now = new Date();
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
    const idsToDelete = data
      .filter((item) => {
        const ts = item.timestamp ? new Date(item.timestamp).getTime() : null;
        if (!ts) return false;
        if (fromTs != null && ts < fromTs) return false;
        return true;
      })
      .map((item) => item._id)
      .filter(Boolean);

    setConfirmDeleteScope({ type: "range", value, ids: idsToDelete });
  };

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

  return (
    <Box
      p={{ xs: 1.5, sm: 3 }}
      sx={{ maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
      >
        <Typography variant="h5">Naměřená data</Typography>

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

          <TimeRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
            label="Zobrazit"
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
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              sx={{
                minWidth: 60,
                width: { xs: "100%", sm: 80 },
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
            onClick={toggleExpandAll}
            variant="outlined"
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {expanded ? "Skrýt" : "Zobrazit"}
          </Button>
        </Box>
      </Box>
      {loading && <CircularProgress sx={{ mt: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {String(error)}
        </Typography>
      )}

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {pagedData && pagedData.length > 0
            ? pagedData.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: "1px solid #eee",
                    borderRadius: 1,
                    backgroundColor: "background.paper",
                  }}
                >
                  <Box
                    display="flex"
                    alignItems={isMobile ? "flex-start" : "center"}
                    gap={deleteMode ? 1 : 0}
                  >
                    {deleteMode && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Checkbox
                          checked={selectedIds.has(item._id)}
                          onChange={(e) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) {
                                next.add(item._id);
                              } else {
                                next.delete(item._id);
                              }
                              return next;
                            });
                          }}
                        />
                      </Box>
                    )}

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack
                        direction={isMobile ? "column" : "row"}
                        alignItems={isMobile ? "flex-start" : "center"}
                        justifyContent="space-between"
                        spacing={isMobile ? 1 : 0}
                      >
                        <Box>
                          <Typography variant={isMobile ? "body2" : "body1"}>
                            <strong>Čas:</strong>{" "}
                            {formatTimestamp(item.timestamp)}
                          </Typography>
                        </Box>

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            mt: isMobile ? 1 : 0,
                            width: isMobile ? "100%" : "auto",
                            flexWrap: "wrap",
                            rowGap: 1,
                          }}
                        >
                          <Chip
                            icon={<DeviceThermostatIcon />}
                            label={`${
                              item.temperature != null
                                ? item.temperature
                                : "-"
                            }${item.temperature != null ? " °C" : ""}`}
                            variant="outlined"
                            sx={{
                              "& .MuiChip-icon": { color: "error.main" },
                            }}
                          />

                          <Chip
                            icon={<OpacityIcon />}
                            label={`${
                              item.humidity != null ? item.humidity : "-"
                            }${item.humidity != null ? " %" : ""}`}
                            variant="outlined"
                            sx={{
                              "& .MuiChip-icon": { color: "info.main" },
                            }}
                          />

                          {(() => {
                            const door = getDoorState(item.illuminance);
                            return (
                              <Chip
                                icon={<DoorFrontIcon />}
                                label={
                                  isMobile ? undefined : `Dveře: ${door.label}`
                                }
                                color={door.color}
                                variant="outlined"
                                sx={{
                                  "& .MuiChip-icon": {
                                    color:
                                      door.color === "success"
                                        ? "success.main"
                                        : door.color === "warning"
                                          ? "warning.main"
                                          : "text.secondary",
                                  },
                                }}
                              />
                            );
                          })()}
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              ))
            : !loading && (
                <Typography>Žádná data pro zvolené zařízení.</Typography>
              )}
        </Box>

        {totalItems > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              mt: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Zobrazeno {startIndex}–{endIndex} z {totalItems} záznamů
            </Typography>

            {totalPages > 1 && (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                justifyContent="center"
              >
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
                  onChange={(_, v) => setPage(v)}
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
      </Collapse>

      <Dialog
        open={Boolean(confirmDeleteScope)}
        onClose={() => setConfirmDeleteScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat naměřená data?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDeleteScope?.type === "selected"
              ? `Opravdu chcete smazat vybrané záznamy? (${confirmDeleteScope.ids.length})`
              : `Opravdu chcete smazat záznamy pro zvolený rozsah? (${confirmDeleteScope?.ids?.length ?? 0})`}
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
