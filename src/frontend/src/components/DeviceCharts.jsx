import React, { useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import { COLOR_TEMPERATURE, COLOR_HUMIDITY } from "../constants/colors.js";
import {
  createAxisFormatter,
  createSliderFormatter,
  getTickCount,
} from "../utils/chartUtils.js";

import TimeRangeSelector from "./TimeRangeSelector.jsx";
import ChartZoomSlider from "./ChartZoomSlider.jsx";
import TemperatureChart from "./TemperatureChart.jsx";
import HumidityChart from "./HumidityChart.jsx";

import { useChartData } from "../hooks/useChartData.js";
import { useChartInteractions } from "../hooks/useChartInteractions.js";

export default function DeviceCharts({ sensorData, allAlerts, device, deviceId, loading }) {
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

  const {
    localZoom,
    isPending,
    handleSliderChange,
    tempChartRef,
    humChartRef,
    chartBoxSx,
    handleChartMouseMove,
    handleChartMouseLeave,
  } = useChartInteractions(zoomRange, setZoomRange, isMobile);

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
              background: `linear-gradient(135deg, ${COLOR_TEMPERATURE} 0%, ${COLOR_HUMIDITY} 100%)`,
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
          <ChartZoomSlider
            localZoom={localZoom}
            dataBounds={dataBounds}
            formatSliderTime={formatSliderTime}
            onSliderChange={handleSliderChange}
            isPending={isPending}
          />
        )}

        {dateFilteredData.length > 0 ? (
          <>
            <TemperatureChart
              chartRef={tempChartRef}
              chartBoxSx={chartBoxSx}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              chartData={chartData}
              isMobile={isMobile}
              temperatureDomain={temperatureDomain}
              formatAxisTime={formatAxisTime}
              tickCount={tickCount}
              latest={latest}
              threshold={threshold}
            />

            <HumidityChart
              chartRef={humChartRef}
              chartBoxSx={chartBoxSx}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              chartData={chartData}
              isMobile={isMobile}
              formatAxisTime={formatAxisTime}
              tickCount={tickCount}
              latest={latest}
              threshold={threshold}
            />
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
