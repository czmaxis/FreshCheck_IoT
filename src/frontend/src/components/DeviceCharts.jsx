import React, { useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  Card,
  CardContent,
  Slider,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import TimeRangeSelector from "../components/TimeRangeSelector.jsx";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from "recharts";

import { useChartData } from "../hooks/useChartData.js";
import {
  formatTime,
  createAxisFormatter,
  createSliderFormatter,
  getTickCount,
} from "../utils/chartUtils.js";

export default function DeviceCharts({ sensorData, allAlerts, device, deviceId, loading, limitsLoading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    latest,
    threshold,
    range,
    dateRange,
    setDateRange,
    expanded,
    toggle,
    zoomRange,
    setZoomRange,
    dateFilteredData,
    dataBounds,
    chartData,
    temperatureDomain,
    timeSpanMs,
    sliderSpanMs,
    applyQuickRange,
    resetZoom,
  } = useChartData(sensorData, allAlerts, device, deviceId);

  const tickCount = getTickCount(timeSpanMs, isMobile);
  const formatAxisTime = useMemo(() => createAxisFormatter(timeSpanMs), [timeSpanMs]);
  const formatSliderTime = useMemo(() => createSliderFormatter(sliderSpanMs), [sliderSpanMs]);

  return (
    <Box
      p={{ xs: 2, sm: 3 }}
      mt={{ xs: 2, sm: 4 }}
      borderRadius={3}
      sx={{
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box",
        backgroundColor: "background.paper",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ef5350 0%, #42a5f5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.9,
            }}
          >
            <DeviceThermostatIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Grafy (teplota / vlhkost)
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <TimeRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
            label="Zobrazit"
            selectedValue={range}
          />

          <Button
            size="small"
            variant="outlined"
            onClick={toggle}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" } }}
          >
            {expanded ? "Skrýt" : "Zobrazit"}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={resetZoom}
            sx={{
              width: { xs: "calc(50% - 4px)", sm: "auto" },
              textTransform: "none",
            }}
          >
            {isMobile ? "Reset" : "Reset zoom"}
          </Button>
        </Box>
      </Box>

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      <Collapse in={expanded}>
        {dateFilteredData.length > 0 && dataBounds && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f5f5f5",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={500}
              sx={{ mb: 1.5 }}
            >
              📊 Posuň výběr pro přiblížení/oddálení časového úseku grafů
            </Typography>

            <Slider
              value={zoomRange ?? [dataBounds.minTs, dataBounds.maxTs]}
              min={dataBounds.minTs}
              max={dataBounds.maxTs}
              step={60 * 1000}
              disableSwap
              valueLabelDisplay="auto"
              valueLabelFormat={formatSliderTime}
              onChange={(_, value) => {
                if (!Array.isArray(value) || value.length !== 2) return;
                const start = Math.min(value[0], value[1]);
                const end = Math.max(value[0], value[1]);
                setZoomRange([start, end]);
              }}
              disabled={dataBounds.minTs === dataBounds.maxTs}
              sx={{
                px: 1,
                mt: 0.5,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                },
              }}
            />

            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1 }}
            >
              <Chip
                label={`Od: ${formatSliderTime((zoomRange ?? [dataBounds.minTs, dataBounds.maxTs])[0])}`}
                size="small"
                sx={{
                  backgroundColor: "white",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
              <Chip
                label={`Do: ${formatSliderTime((zoomRange ?? [dataBounds.minTs, dataBounds.maxTs])[1])}`}
                size="small"
                sx={{
                  backgroundColor: "white",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          </Box>
        )}

        {dateFilteredData.length > 0 ? (
          <>
            {/* Temperature chart */}
            <Card
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 3,
                borderLeft: "4px solid #ef5350",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1.5}
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#ef535015",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DeviceThermostatIcon
                        fontSize="small"
                        sx={{ color: "#ef5350" }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Teplota (°C)
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<DeviceThermostatIcon />}
                      label={
                        latest?.temperature != null
                          ? `${latest.temperature} °C`
                          : "-"
                      }
                      sx={{
                        backgroundColor: "#ef535015",
                        border: "1px solid #ef535030",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#ef5350" },
                        "& .MuiChip-label": { color: "#ef5350" },
                      }}
                    />
                    <Chip
                      label={
                        threshold?.temperature?.min != null ||
                        threshold?.temperature?.max != null
                          ? `Limity: ${threshold?.temperature?.min ?? "—"}–${
                              threshold?.temperature?.max ?? "—"
                            } °C`
                          : "Limity: —"
                      }
                      size="small"
                      sx={{
                        backgroundColor: "#9e9e9e15",
                        fontWeight: 500,
                        "& .MuiChip-label": { color: "#9e9e9e" },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="deviceChartsSync">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        tickCount={tickCount}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 20 : 30}
                        height={isMobile ? 30 : 50}
                      />
                      <YAxis
                        domain={[temperatureDomain.min, temperatureDomain.max]}
                        tickFormatter={(v) => `${Math.round(v)}°`}
                        axisLine={{ stroke: "#ff5722" }}
                        tickLine={{ stroke: "#ff5722" }}
                        width={isMobile ? 36 : 60}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Teplota (°C)",
                                angle: -90,
                                position: "insideLeft",
                              }
                        }
                      />
                      <Tooltip
                        labelFormatter={(v) => formatTime(new Date(v))}
                        formatter={(value, name) => {
                          if (name.includes("Teplota"))
                            return [`${value} °C`, name];
                          return [value, name];
                        }}
                      />
                      {!isMobile && <Legend />}

                      {threshold?.temperature?.min != null && (
                        <ReferenceArea
                          y1={temperatureDomain.min}
                          y2={threshold.temperature.min}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}
                      {threshold?.temperature?.min != null &&
                        threshold?.temperature?.max != null && (
                          <ReferenceArea
                            y1={threshold.temperature.min}
                            y2={threshold.temperature.max}
                            fill="#f8fbf7"
                            fillOpacity={0.35}
                            strokeOpacity={0}
                          />
                        )}
                      {threshold?.temperature?.max != null && (
                        <ReferenceArea
                          y1={threshold.temperature.max}
                          y2={temperatureDomain.max}
                          fill="#e5e5e5"
                          fillOpacity={0.55}
                          strokeOpacity={0}
                        />
                      )}

                      <Line
                        type="linear"
                        dataKey="temperature"
                        name="Teplota (°C)"
                        stroke="#ff5a3c"
                        dot={!isMobile}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Humidity chart */}
            <Card
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 3,
                borderLeft: "4px solid #42a5f5",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ pb: 2 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1.5}
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        backgroundColor: "#42a5f515",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <OpacityIcon fontSize="small" sx={{ color: "#42a5f5" }} />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Vlhkost (%)
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<OpacityIcon />}
                      label={
                        latest?.humidity != null ? `${latest.humidity} %` : "-"
                      }
                      sx={{
                        backgroundColor: "#42a5f515",
                        border: "1px solid #42a5f530",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#42a5f5" },
                        "& .MuiChip-label": { color: "#42a5f5" },
                      }}
                    />
                    <Chip
                      label={
                        threshold?.humidity?.min != null ||
                        threshold?.humidity?.max != null
                          ? `Limity: ${threshold?.humidity?.min ?? "—"}–${
                              threshold?.humidity?.max ?? "—"
                            } %`
                          : "Limity: —"
                      }
                      size="small"
                      sx={{
                        backgroundColor: "#9e9e9e15",
                        fontWeight: 500,
                        "& .MuiChip-label": { color: "#9e9e9e" },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "100%", height: isMobile ? 260 : 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} syncId="deviceChartsSync">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        padding={{ left: 8, right: 16 }}
                        tickFormatter={formatAxisTime}
                        tickCount={tickCount}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        minTickGap={isMobile ? 20 : 30}
                        height={isMobile ? 30 : 50}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={{ stroke: "#2196f3" }}
                        tickLine={{ stroke: "#2196f3" }}
                        width={isMobile ? 36 : 60}
                        label={
                          isMobile
                            ? undefined
                            : {
                                value: "Vlhkost (%)",
                                angle: -90,
                                position: "insideLeft",
                              }
                        }
                      />
                      <Tooltip
                        labelFormatter={(v) => formatTime(new Date(v))}
                        formatter={(value, name) => {
                          if (name.includes("Vlhkost"))
                            return [`${value} %`, name];
                          return [value, name];
                        }}
                      />
                      {!isMobile && <Legend />}

                      {threshold?.humidity?.min != null && (
                        <ReferenceArea
                          y1={0}
                          y2={threshold.humidity.min}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}
                      {threshold?.humidity?.min != null &&
                        threshold?.humidity?.max != null && (
                          <ReferenceArea
                            y1={threshold.humidity.min}
                            y2={threshold.humidity.max}
                            fill="#f8fbf7"
                            fillOpacity={0.35}
                            strokeOpacity={0}
                          />
                        )}
                      {threshold?.humidity?.max != null && (
                        <ReferenceArea
                          y1={threshold.humidity.max}
                          y2={100}
                          fill="#e5e5e5"
                          fillOpacity={0.35}
                          strokeOpacity={0}
                        />
                      )}

                      <Line
                        type="linear"
                        dataKey="humidity"
                        name="Vlhkost (%)"
                        stroke="#1aa6c8"
                        dot={!isMobile}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </>
        ) : (
          !loading && (
            <Typography sx={{ mt: 2 }}>
              Žádná data v tomto časovém rozsahu.
            </Typography>
          )
        )}
      </Collapse>
    </Box>
  );
}
