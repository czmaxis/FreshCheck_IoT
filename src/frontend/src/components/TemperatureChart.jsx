import React from "react";
import { Box, Typography, Card, CardContent, Chip } from "@mui/material";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
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
import { COLOR_TEMPERATURE, COLOR_DEFAULT, chipSx } from "../constants/colors.js";
import { formatTime } from "../utils/chartUtils.js";

export default function TemperatureChart({
  chartRef,
  chartBoxSx,
  onMouseMove,
  onMouseLeave,
  chartData,
  isMobile,
  temperatureDomain,
  formatAxisTime,
  tickCount,
  latest,
  threshold,
  onAnimationEnd,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        mt: 3,
        borderRadius: 3,
        borderLeft: `4px solid ${COLOR_TEMPERATURE}`,
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
                backgroundColor: `${COLOR_TEMPERATURE}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DeviceThermostatIcon
                fontSize="small"
                sx={{ color: COLOR_TEMPERATURE }}
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
              sx={chipSx(COLOR_TEMPERATURE)}
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
                backgroundColor: `${COLOR_DEFAULT}15`,
                fontWeight: 500,
                "& .MuiChip-label": { color: COLOR_DEFAULT },
              }}
            />
          </Box>
        </Box>
        <Box
          ref={chartRef}
          sx={chartBoxSx}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                onAnimationEnd={onAnimationEnd}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
