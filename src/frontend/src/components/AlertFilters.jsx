import React from "react";
import { Box, Button, ButtonGroup } from "@mui/material";
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

export default function AlertFilters({ dateRange, onDateRangeChange, onQuickRange }) {
  return (
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
      <ButtonGroup size="small" variant="outlined">
        {QUICK_RANGES.map((r) => (
          <Button key={r.value} onClick={() => onQuickRange(r.value)}>
            {r.label}
          </Button>
        ))}
      </ButtonGroup>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
        <DateRangeSingleCalendar
          value={dateRange}
          onChange={onDateRangeChange}
          label="Od–do"
          size="small"
        />
      </LocalizationProvider>
    </Box>
  );
}
