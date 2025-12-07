import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Button,
} from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

export default function SensorData({ deviceId }) {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // single collapse/expand state for the whole block
  const [expanded, setExpanded] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // reset paging and expanded state when device changes
    setPage(1);
    setExpanded(true);
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
              "Chyba při načítání sensor dat."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [deviceId, token]);

  // pagination calculations
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const toggleExpandAll = () => {
    setExpanded((v) => !v);
  };

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Sensor data</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            onClick={toggleExpandAll}
            variant="outlined"
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {expanded ? "Skrýt data" : "Zobrazit data"}
          </Button>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="page-size-label">Na stránce</InputLabel>
            <Select
              labelId="page-size-label"
              value={pageSize}
              label="Na stránce"
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
          />
        </Stack>
      </Stack>

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
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography>
                        <strong>Čas:</strong> {formatTimestamp(item.timestamp)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={<DeviceThermostatIcon />}
                        label={`${
                          item.temperature !== undefined
                            ? item.temperature
                            : "—"
                        }${item.temperature !== undefined ? " °C" : ""}`}
                        variant="outlined"
                      />

                      <Chip
                        icon={<OpacityIcon />}
                        label={`${
                          item.humidity !== undefined ? item.humidity : "—"
                        }${item.humidity !== undefined ? " %" : ""}`}
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))
            : !loading && (
                <Typography>Žádná data pro zvolené zařízení.</Typography>
              )}
        </Box>

        {/* bottom pagination for convenience */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
