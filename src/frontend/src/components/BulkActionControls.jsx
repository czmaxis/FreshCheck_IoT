import { Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";

import DateRangeSingleCalendar from "./DateRangeSingleCalendar.jsx";
import ActionSelector from "./ActionSelector.jsx";

export default function BulkActionControls({
  bulkResolve,
  bulkDelete,
  isMobile,
}) {
  return (
    <>
      <ActionSelector
        type="resolve"
        selectionMode={bulkResolve.mode}
        selectedIds={bulkResolve.selectedIds}
        loading={bulkResolve.loading}
        onRangeSelect={bulkResolve.handleRange}
        onConfirmSelection={bulkResolve.requestSelected}
        onCancelSelection={bulkResolve.cancelMode}
      />

      <ActionSelector
        type="delete"
        selectionMode={bulkDelete.mode}
        selectedIds={bulkDelete.selectedIds}
        loading={bulkDelete.loading}
        onRangeSelect={bulkDelete.handleRange}
        onConfirmSelection={bulkDelete.requestSelected}
        onCancelSelection={bulkDelete.cancelMode}
      />

      {bulkResolve.showCustomRange && !bulkResolve.mode && (
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <DateRangeSingleCalendar
              value={bulkResolve.customDateRange}
              onChange={bulkResolve.setCustomDateRange}
              label="Od\u2013do"
              size="small"
              fullWidth={isMobile}
              autoOpenKey={bulkResolve.calendarOpenKey}
            />
          </LocalizationProvider>
        </Box>
      )}

      {bulkDelete.showCustomRange && !bulkDelete.mode && (
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <DateRangeSingleCalendar
              value={bulkDelete.customDateRange}
              onChange={bulkDelete.setCustomDateRange}
              label="Od\u2013do"
              size="small"
              fullWidth={isMobile}
              autoOpenKey={bulkDelete.calendarOpenKey}
            />
          </LocalizationProvider>
        </Box>
      )}
    </>
  );
}
