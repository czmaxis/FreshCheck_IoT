import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Button,
  MenuItem,
  TextField,
  Pagination,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getAlerts, resolveAlert } from "../services/alertService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Alerts({ deviceId }) {
  const { token } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!deviceId) return;

    let cancelled = false;

    async function load() {
      try {
        setError("");
        const data = await getAlerts(deviceId, { active: true }, token);
        if (!cancelled) setAlerts(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Nepodařilo se načíst výstrahy."
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

  const handleResolve = async (alertId) => {
    try {
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      await resolveAlert(alertId, token);
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se vyřešit výstrahu."
      );
    }
  };

  function getMessage(alert) {
    switch (alert.type) {
      case "humidity":
        return `Byla překročena hranice vlhkosti ${alert.value} %`;
      case "temperature":
        return `Byla překročena hranice teploty ${alert.value} °C`;
      case "doorOpen":
        return `Dveře byly otevřené déle než ${alert.value} sekund`;
      default:
        return `Došlo k překročení limitu (${alert.type})`;
    }
  }

  if (alerts.length === 0) return null;

  // pagination calculations
  const totalItems = alerts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const pagedAlerts = alerts.slice((page - 1) * perPage, page * perPage);

  return (
    <Box width="100%" mb={3}>
      {/* HLAVIČKA */}
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

        <Box display="flex" alignItems="center" gap={2}>
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
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {visible && (
        <Box px={3}>
          {pagedAlerts.map((alert) => (
            <Alert
              key={alert._id}
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleResolve(alert._id)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <AlertTitle>Výstraha</AlertTitle>
              {getMessage(alert)}
              <br />
              <small>
                Čas: {new Date(alert.timestamp).toLocaleString("cs-CZ")}
              </small>
            </Alert>
          ))}
        </Box>
      )}
      {visible && totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
            px: 3,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="small"
          />
        </Box>
      )}
      {!visible && (
        <Typography variant="body2" color="text.secondary">
          Výstrahy jsou skryté.
        </Typography>
      )}
    </Box>
  );
}
