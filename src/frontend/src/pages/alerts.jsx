import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  MenuItem,
  TextField,
  Pagination,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getAlerts, resolveAlert, deleteAlert } from "../services/alertService.js";
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
      await resolveAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      setError(
        err.response?.data?.message || "Nepodařilo se vyřešit výstrahu."
      );
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await deleteAlert(alertId, token);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch (err) {
      setError(err.response?.data?.message || "Nepodařilo se smazat výstrahu.");
    }
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
    switch (alert.type) {
      case "humidity":
        return "Vysoká vlhkost";
      case "temperature":
        return "Vysoká teplota";
      case "door":
        return "Dveře otevřeny";
      default:
        return "Výstraha";
    }
  };

  const formatValue = (alert) => {
    if (alert.type === "humidity") {
      const limit =
        alert.threshold?.humidity?.max ?? alert.threshold?.max ?? null;
      return `💧 ${alert.value ?? "-"} %${
        limit !== null ? ` (limit ${limit} %)` : ""
      }`;
    }
    if (alert.type === "temperature") {
      const limit =
        alert.threshold?.temperature?.max ?? alert.threshold?.max ?? null;
      return `🌡 ${alert.value ?? "-"} °C${
        limit !== null ? ` (limit ${limit} °C)` : ""
      }`;
    }
    if (alert.type === "door") {
      return `🚪 ${alert.value ?? "-"} s`;
    }
    return `${alert.value ?? "-"}`;
  };

  if (alerts.length === 0) return null;

  const totalItems = alerts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const pagedAlerts = alerts.slice((page - 1) * perPage, page * perPage);
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
                  onClick={() => handleDelete(alert._id)}
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
    </Box>
  );
}
