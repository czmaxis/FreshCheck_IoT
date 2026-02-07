import React, { useState } from "react";
import { Box, TextField, MenuItem, useMediaQuery } from "@mui/material";
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

export default function TimeRangeSelector({
  dateRange,
  onDateRangeChange,
  onQuickRange,
  label = "Zobrazit",
  selectedValue = "",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [quickRange, setQuickRange] = useState(selectedValue);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [calendarOpenKey, setCalendarOpenKey] = useState(0);

  React.useEffect(() => {
    setQuickRange(selectedValue ?? "");
  }, [selectedValue]);

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
          width: { xs: "100%", sm: 220 },
          flexShrink: 0,
        }}
      >
        <TextField
          select
          size="small"
          label={label}
          color="primary"
          value={quickRange}
          onChange={(e) => {
            const value = e.target.value;
            setQuickRange(value);
            if (value === "custom") {
              setShowCustomRange(true);
              setCalendarOpenKey((k) => k + 1);
            } else {
              setShowCustomRange(false);
              if (value) onQuickRange(value);
            }
          }}
          fullWidth={isMobile}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        >
          {QUICK_RANGES.map((r) => (
            <MenuItem key={r.value} value={r.value}>
              {r.label}
            </MenuItem>
          ))}
          <MenuItem value="custom">Od-do</MenuItem>
        </TextField>
      </Box>

      {showCustomRange && (
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <DateRangeSingleCalendar
              value={dateRange}
              onChange={onDateRangeChange}
              label="Od-do"
              size="small"
              fullWidth={isMobile}
              autoOpenKey={calendarOpenKey}
            />
          </LocalizationProvider>
        </Box>
      )}
    </Box>
  );
}
