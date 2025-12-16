import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Alert,
  AlertTitle,
  TextField,
  Pagination,
} from "@mui/material";
import NavBar from "./navBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js";
import { getAlerts } from "../services/alertService.js";

export default function AlertsHistory() {
  const { token } = useAuth();

  /* =====================
     DEVICES
  ====================== */
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  /* =====================
     ALERTS
  ====================== */
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  /* =====================
     FILTERS
  ====================== */
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | resolved
  const [typeFilter, setTypeFilter] = useState("all"); // all | temperature | humidity | door | doorOpen

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
        const data = await getAlerts(selectedDeviceId, {}, token);
        if (!cancelled) setAlerts(data || []);
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
  }, [statusFilter, typeFilter, perPage, selectedDeviceId]);

  /* =====================
     HELPERS
  ====================== */
  function getMessage(alert) {
    switch (alert.type) {
      case "humidity":
        return `Byla překročena hranice vlhkosti ${alert.value} %`;
      case "temperature":
        return `Byla překročena hranice teploty ${alert.value} °C`;
      case "door":
      case "doorOpen":
        return `Dveře byly otevřené déle než ${alert.value} sekund`;
      default:
        return `Došlo k překročení limitu (${alert.type})`;
    }
  }

  /* =====================
     FILTERING
  ====================== */
  const filteredAlerts = alerts.filter((alert) => {
    // status
    if (statusFilter === "active" && !alert.active) return false;
    if (statusFilter === "resolved" && alert.active) return false;

    // type
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;

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
            <Button
              variant="outlined"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              {selectedDeviceId
                ? devices.find((d) => d._id === selectedDeviceId)?.name
                : "Vyber zařízení"}
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {devices.map((d) => (
                <MenuItem
                  key={d._id}
                  onClick={() => {
                    setSelectedDeviceId(d._id);
                    setAnchorEl(null);
                  }}
                >
                  {d.name} — {d.location}
                </MenuItem>
              ))}
            </Menu>

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
              <MenuItem value="door">Dveře</MenuItem>
              <MenuItem value="doorOpen">Dveře</MenuItem>
            </TextField>

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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* ALERTS LIST */}
        {pagedAlerts.length === 0 ? (
          <Typography>Žádné výstrahy pro zvolené filtry.</Typography>
        ) : (
          <Box px={3}>
            {pagedAlerts.map((alert) => (
              <Alert
                key={alert._id}
                severity={alert.active ? "warning" : "info"}
                sx={{ mb: 2 }}
              >
                <AlertTitle>
                  {alert.active ? "Výstraha" : "Vyřešená výstraha"}
                </AlertTitle>
                {getMessage(alert)}
                <br />
                <small>
                  Čas: {new Date(alert.timestamp).toLocaleString("cs-CZ")}
                </small>
              </Alert>
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
