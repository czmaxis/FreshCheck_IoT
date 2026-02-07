import React from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import DateRangeSingleCalendar from "./DateRangeSingleCalendar.jsx";

const QUICK_RANGES = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "Včera", value: "yesterday" },
  { label: "Tento týden", value: "thisWeek" },
  { label: "7d", value: "7d" },
  { label: "Vše", value: "all" },
];

export default function AlertFilters({
  dateRange,
  onDateRangeChange,
  onQuickRange,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      flexWrap="wrap"
      sx={{ width: { xs: "100%", sm: "auto" } }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {QUICK_RANGES.map((r) => (
          <Button
            key={r.value}
            size="small"
            variant="outlined"
            onClick={() => onQuickRange(r.value)}
            sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
          >
            {r.label}
          </Button>
        ))}
      </Box>

      <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
          <DateRangeSingleCalendar
            value={dateRange}
            onChange={onDateRangeChange}
            label="Od–do"
            size="small"
            fullWidth={isMobile}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );
}


