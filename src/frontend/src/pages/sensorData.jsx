import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Collapse,
  MenuItem,
  Pagination,
  Button,
  TextField,
} from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuth } from "../context/AuthContext.jsx";
import { getSensorData } from "../services/sensorDataService.js";
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

export default function SensorData({ deviceId }) {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Sensor data</Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
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
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    alignItems={isMobile ? "flex-start" : "center"}
                    justifyContent="space-between"
                    spacing={isMobile ? 1 : 0}
                  >
                    <Box>
                      <Typography variant={isMobile ? "body2" : "body1"}>
                        <strong>Čas:</strong> {formatTimestamp(item.timestamp)}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        mt: isMobile ? 1 : 0,
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
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
                          />
                        );
                      })()}
                    </Stack>
                  </Stack>
                </Box>
              ))
            : !loading && (
                <Typography>Žádná data pro zvolené zařízení.</Typography>
              )}
        </Box>

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
