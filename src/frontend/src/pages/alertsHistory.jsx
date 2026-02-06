import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  TextField,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import NavBar from "./navBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices, getDevice } from "../services/deviceService.js";
import { getAlerts } from "../services/alertService.js";
import AlertCard from "../components/AlertCard.jsx";

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
  const [deviceThreshold, setDeviceThreshold] = useState(null);
  const [error, setError] = useState("");

  /* =====================
     FILTERS
  ====================== */
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | resolved
  const [typeFilter, setTypeFilter] = useState("all"); // all | temperature | humidity | door | doorOpen
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD

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
        setError("");
        const [data, device] = await Promise.all([
          getAlerts(selectedDeviceId, {}, token),
          getDevice(selectedDeviceId, token),
        ]);
        if (!cancelled) {
          setAlerts(data || []);
          setDeviceThreshold(device?.threshold ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Nepodařilo se načíst historii výstrah.");
        }
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
  }, [statusFilter, typeFilter, perPage, selectedDeviceId, dateFrom, dateTo]);
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
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
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
            <TextField
              label="Od"
              type="date"
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Do"
              type="date"
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
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
        {pagedAlerts.length === 0 ? (
          <Typography>Žádné výstrahy pro zvolené filtry.</Typography>
        ) : (
          <Box px={3}>
            {pagedAlerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                deviceThreshold={deviceThreshold}
              />
            ))}
          </Box>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Box>
    </>
  );
}
