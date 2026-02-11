import React from "react";
import { Box, Typography, Card, CardContent, Chip } from "@mui/material";
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
import { COLOR_HUMIDITY, COLOR_DEFAULT, chipSx } from "../constants/colors.js";
import { formatTime } from "../utils/chartUtils.js";

export default function HumidityChart({
  chartRef,
  chartBoxSx,
  onMouseMove,
  onMouseLeave,
  chartData,
  isMobile,
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
        borderLeft: `4px solid ${COLOR_HUMIDITY}`,
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
                backgroundColor: `${COLOR_HUMIDITY}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <OpacityIcon fontSize="small" sx={{ color: COLOR_HUMIDITY }} />
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
              sx={chipSx(COLOR_HUMIDITY)}
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
                onAnimationEnd={onAnimationEnd}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
