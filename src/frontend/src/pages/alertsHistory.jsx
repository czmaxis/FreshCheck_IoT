import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  MenuItem,
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import AlertCard from "../components/AlertCard.jsx";
import AlertCardSkeleton from "../components/AlertCardSkeleton.jsx";
import AlertFilters from "../components/AlertFilters.jsx";
import AlertPagination from "../components/AlertPagination.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import PerPageSelector from "../components/PerPageSelector.jsx";
import BulkActionControls from "../components/BulkActionControls.jsx";
import BulkConfirmDialogs from "../components/BulkConfirmDialogs.jsx";

import { useAlertsHistory } from "../hooks/useAlertsHistory.js";
import { useBulkActions } from "../hooks/useBulkActions.js";
import { useHistoryFiltering } from "../hooks/useHistoryFiltering.js";
import { PER_PAGE_OPTIONS_HISTORY } from "../utils/dateRangeUtils.js";

export default function AlertsHistory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    alerts,
    alertsLoading,
    error,
    pendingIds,
    handleResolve,
    handleDelete,
    handleRestore,
    handleDeleteSelection,
    handleResolveSelection,
  } = useAlertsHistory();

  const bulkDelete = useBulkActions(alerts, handleDeleteSelection);
  const bulkResolve = useBulkActions(alerts, handleResolveSelection, {
    activeOnly: true,
  });

  const {
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    dateRange,
    setDateRange,
    applyQuickRange,
    perPage,
    setPerPage,
    page,
    setPage,
    pagedAlerts,
    totalItems,
    resetFilters,
  } = useHistoryFiltering(alerts, selectedDeviceId);

  useEffect(() => {
    bulkDelete.resetAll();
    bulkResolve.resetAll();
  }, [selectedDeviceId, bulkDelete.resetAll, bulkResolve.resetAll]);

  return (
    <>
      <Box
        px={{ xs: 1, sm: 2, md: 3 }}
        py={2}
        sx={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h4">Historie výstrah</Typography>

          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {/* DEVICE SELECTOR */}
            <Box
              sx={{
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: 0, sm: 280 },
                p: 2,
                borderRadius: 3,
                backgroundColor: "background.paper",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxSizing: "border-box",
                "&:hover": {
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                },
              }}
            >
              <FormControl
                variant="standard"
                fullWidth
                sx={{
                  "& .MuiInputLabel-root": {
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiInput-root": {
                    fontSize: "1rem",
                    fontWeight: 500,
                    "&:before": {
                      borderBottom: "none",
                    },
                    "&:after": {
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                    },
                    "&:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  },
                }}
              >
                <InputLabel id="device-select-label">
                  Vyber zařízení
                </InputLabel>
                <Select
                  labelId="device-select-label"
                  value={selectedDeviceId ?? ""}
                  label="Vyber zařízení"
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {devices && devices.length > 0 ? (
                    devices.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} — {d.location}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      Žádná zařízení
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <BulkActionControls
                bulkResolve={bulkResolve}
                bulkDelete={bulkDelete}
                isMobile={isMobile}
              />
            </Box>

            <AlertFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onQuickRange={applyQuickRange}
            />
            {/* STATUS FILTER */}
            <TextField
              select
              size="small"
              label="Stav"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 100, width: { xs: "100%", sm: "auto" } }}
            >
              <MenuItem value="all">Vše</MenuItem>
              <MenuItem value="active">Nevyřešené</MenuItem>
              <MenuItem value="resolved">Vyřešené</MenuItem>
            </TextField>

            {/* TYPE FILTER */}
            <TextField
              select
              size="small"
              label="Typ"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 100, width: { xs: "100%", sm: "auto" } }}
            >
              <MenuItem value="all">Vše</MenuItem>
              <MenuItem value="temperature">Teplota</MenuItem>
              <MenuItem value="humidity">Vlhkost</MenuItem>
              {/*  <MenuItem value="door">Dveře</MenuItem>*/}
              <MenuItem value="doorOpen"> Otevřené dveře</MenuItem>
            </TextField>
            <Button
              variant="text"
              size="small"
              onClick={resetFilters}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Reset filtrů
            </Button>
            {/* PER PAGE */}
            <PerPageSelector
              value={perPage}
              onChange={setPerPage}
              options={PER_PAGE_OPTIONS_HISTORY}
            />
          </Box>
        </Box>

        {/* ERROR */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* ALERTS LIST */}
        {alertsLoading ? (
          <Box px={{ xs: 0, sm: 3 }}>
            <AlertCardSkeleton count={Math.min(3, perPage)} />
          </Box>
        ) : pagedAlerts.length === 0 ? (
          <Typography>Žádné výstrahy pro zvolené filtry.</Typography>
        ) : (
          <Box
            px={{ xs: 0, sm: 3 }}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(auto-fill, minmax(320px, 1fr))",
              },
              gap: 2,
            }}
          >
            {pagedAlerts.map((alert) => (
              <Box
                key={alert._id}
                display="flex"
                alignItems="flex-start"
                gap={1}
                sx={{ minWidth: 0 }}
              >
                {bulkDelete.mode && (
                  <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, pt: 1 }}>
                    <Checkbox
                      checked={bulkDelete.selectedIds.has(alert._id)}
                      onChange={(e) => {
                        bulkDelete.setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(alert._id);
                          else next.delete(alert._id);
                          return next;
                        });
                      }}
                    />
                  </Box>
                )}
                {bulkResolve.mode && (
                  <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0, pt: 1 }}>
                    <Checkbox
                      disabled={!alert.active}
                      checked={bulkResolve.selectedIds.has(alert._id)}
                      onChange={(e) => {
                        if (!alert.active) return;
                        bulkResolve.setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(alert._id);
                          else next.delete(alert._id);
                          return next;
                        });
                      }}
                    />
                  </Box>
                )}
                {pendingIds.includes(alert._id) ? (
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <AlertCardSkeleton count={1} />
                  </Box>
                ) : (
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <AlertCard
                      alert={alert}
                      onResolve={() => handleResolve(alert._id)}
                      onRestore={() => handleRestore(alert._id)}
                      onDelete={() => setConfirmDeleteId(alert._id)}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* PAGINATION */}
        <AlertPagination
          totalItems={totalItems}
          perPage={perPage}
          page={page}
          onPageChange={setPage}
        />

        <ConfirmDeleteDialog
          open={Boolean(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            handleDelete(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
        />

        <BulkConfirmDialogs bulkDelete={bulkDelete} bulkResolve={bulkResolve} />
      </Box>
    </>
  );
}
