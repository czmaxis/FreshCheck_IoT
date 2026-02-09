import { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Checkbox,
  Collapse,
  MenuItem,
  Pagination,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import TimeRangeSelector from "../components/TimeRangeSelector.jsx";
import ActionSelector from "../components/ActionSelector.jsx";
import PerPageSelector from "../components/PerPageSelector.jsx";
import SensorDataCard from "../components/SensorDataCard.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useTheme, useMediaQuery } from "@mui/material";

import { useSensorData } from "../hooks/useSensorData.js";
import { useSensorDelete } from "../hooks/useSensorDelete.js";

export default function SensorData({ sensorData, setSensorData, deviceId, loading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [error, setError] = useState("");

  const {
    data,
    expanded,
    toggleExpandAll,
    typeFilter,
    setTypeFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    dateRange,
    setDateRange,
    applyQuickRange,
    pagedData,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
  } = useSensorData(sensorData, deviceId);

  const {
    deleteMode,
    selectedIds,
    setSelectedIds,
    deleteLoading,
    confirmDeleteScope,
    setConfirmDeleteScope,
    deleteDateRange,
    setDeleteDateRange,
    showDeleteCustomRange,
    deleteCalendarOpenKey,
    handleDeleteRange,
    requestDeleteSelected,
    confirmDelete,
    cancelDeleteMode,
  } = useSensorDelete(deviceId, data, setSensorData, setError);

  return (
    <Box
      p={{ xs: 1.5, sm: 3 }}
      sx={{ maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
      >
        <Typography variant="h5">Naměřená data</Typography>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <ActionSelector
            type="delete"
            selectionMode={deleteMode}
            selectedIds={selectedIds}
            loading={deleteLoading}
            onRangeSelect={handleDeleteRange}
            onConfirmSelection={requestDeleteSelected}
            onCancelSelection={cancelDeleteMode}
          />

          {showDeleteCustomRange && !deleteMode && (
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="cs"
              >
                <DateRangeSingleCalendar
                  value={deleteDateRange}
                  onChange={setDeleteDateRange}
                  label="Od–do"
                  size="small"
                  fullWidth={isMobile}
                  autoOpenKey={deleteCalendarOpenKey}
                />
              </LocalizationProvider>
            </Box>
          )}

          <TimeRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
            label="Zobrazit"
          />

          <TextField
            select
            size="small"
            label="Druh dat"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 180, width: { xs: "100%", sm: 200 } }}
          >
            <MenuItem value="all">Vše</MenuItem>
            <MenuItem value="temperature">Teplota</MenuItem>
            <MenuItem value="humidity">Vlhkost</MenuItem>
            <MenuItem value="doorOpen">Dveře otevřeno</MenuItem>
            <MenuItem value="doorClosed">Dveře zavřeno</MenuItem>
          </TextField>

          <PerPageSelector
            value={pageSize}
            onChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            options={[1, 5, 10, 20]}
          />

          <Button
            onClick={toggleExpandAll}
            variant="outlined"
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
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
                  display="flex"
                  alignItems="flex-start"
                  gap={deleteMode ? 1.5 : 0}
                >
                  {deleteMode && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        pt: 1,
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(item._id)}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(item._id);
                            } else {
                              next.delete(item._id);
                            }
                            return next;
                          });
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <SensorDataCard item={item} isMobile={isMobile} />
                  </Box>
                </Box>
              ))
            : !loading && (
                <Typography>Žádná data pro zvolené zařízení.</Typography>
              )}
        </Box>

        {totalItems > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              mt: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Zobrazeno {startIndex}–{endIndex} z {totalItems} záznamů
            </Typography>

            {totalPages > 1 && (
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                flexWrap="wrap"
                justifyContent="center"
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  ⏮ První
                </Button>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  color="primary"
                  size="small"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  ⏭ Poslední
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Collapse>

      <Dialog
        open={Boolean(confirmDeleteScope)}
        onClose={() => setConfirmDeleteScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat naměřená data?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirmDeleteScope?.type === "selected"
              ? `Opravdu chcete smazat vybrané záznamy? (${confirmDeleteScope.ids.length})`
              : `Opravdu chcete smazat záznamy pro zvolený rozsah? (${confirmDeleteScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteScope(null)}>Zrušit</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
