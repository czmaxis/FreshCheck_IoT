import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import DateRangeSingleCalendar from "../components/DateRangeSingleCalendar.jsx";
import AlertCard from "../components/AlertCard.jsx";
import AlertFilters from "../components/AlertFilters.jsx";
import AlertPagination from "../components/AlertPagination.jsx";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog.jsx";
import AlertCardSkeleton from "../components/AlertCardSkeleton.jsx";
import ActionSelector from "../components/ActionSelector.jsx";
import PerPageSelector from "../components/PerPageSelector.jsx";

import { useAlerts } from "../hooks/useAlerts.js";
import { useBulkActions } from "../hooks/useBulkActions.js";
import { useAlertFiltering } from "../hooks/useAlertFiltering.js";
import { PER_PAGE_OPTIONS_ACTIVE } from "../utils/dateRangeUtils.js";

export default function Alerts({ deviceId, refreshKey, onAlertsChanged }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [visible, setVisible] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const {
    alerts,
    error,
    pendingIds,
    handleResolve,
    handleDelete,
    handleDeleteSelection,
    handleResolveSelection,
  } = useAlerts(deviceId, refreshKey, { active: true }, onAlertsChanged);

  const bulkDelete = useBulkActions(alerts, handleDeleteSelection);
  const bulkResolve = useBulkActions(alerts, handleResolveSelection);

  const resetBulkDelete = bulkDelete.resetAll;
  const resetBulkResolve = bulkResolve.resetAll;

  const {
    dateRange,
    setDateRange,
    applyQuickRange,
    perPage,
    setPerPage,
    page,
    setPage,
    pagedAlerts,
    totalItems,
  } = useAlertFiltering(alerts, deviceId);

  useEffect(() => {
    resetBulkDelete();
    resetBulkResolve();
  }, [deviceId, resetBulkDelete, resetBulkResolve]);

  if (alerts.length === 0) return null;

  return (
    <Box
      width="100%"
      mb={3}
      sx={{ maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box
        p={{ xs: 1.5, sm: 3 }}
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={1}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="h5" mr={{ xs: 0, sm: 1 }}>
            Výstrahy
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
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
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="cs"
              >
                <DateRangeSingleCalendar
                  value={bulkResolve.customDateRange}
                  onChange={bulkResolve.setCustomDateRange}
                  label="Od–do"
                  size="small"
                  fullWidth={isMobile}
                  autoOpenKey={bulkResolve.calendarOpenKey}
                />
              </LocalizationProvider>
            </Box>
          )}

          {bulkDelete.showCustomRange && !bulkDelete.mode && (
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="cs"
              >
                <DateRangeSingleCalendar
                  value={bulkDelete.customDateRange}
                  onChange={bulkDelete.setCustomDateRange}
                  label="Od–do"
                  size="small"
                  fullWidth={isMobile}
                  autoOpenKey={bulkDelete.calendarOpenKey}
                />
              </LocalizationProvider>
            </Box>
          )}

          <AlertFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onQuickRange={applyQuickRange}
          />

          <PerPageSelector
            value={perPage}
            onChange={setPerPage}
            options={PER_PAGE_OPTIONS_ACTIVE}
          />

          <Button
            size="small"
            variant="outlined"
            onClick={() => setVisible((v) => !v)}
            startIcon={visible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {visible ? "Skrýt" : "Zobrazit"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}

      {visible && (
        <Box px={{ xs: 1.5, sm: 3 }}>
          {pagedAlerts.map((alert) => (
            <Box key={alert._id} display="flex" alignItems="flex-start" gap={1}>
              {bulkDelete.mode && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                    pt: 1,
                  }}
                >
                  <Checkbox
                    checked={bulkDelete.selectedIds.has(alert._id)}
                    onChange={(e) => {
                      bulkDelete.setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(alert._id);
                        } else {
                          next.delete(alert._id);
                        }
                        return next;
                      });
                    }}
                  />
                </Box>
              )}
              {bulkResolve.mode && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                    pt: 1,
                  }}
                >
                  <Checkbox
                    checked={bulkResolve.selectedIds.has(alert._id)}
                    onChange={(e) => {
                      bulkResolve.setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) {
                          next.add(alert._id);
                        } else {
                          next.delete(alert._id);
                        }
                        return next;
                      });
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {pendingIds.includes(alert._id) ? (
                  <AlertCardSkeleton count={1} />
                ) : (
                  <AlertCard
                    alert={alert}
                    onResolve={() => handleResolve(alert._id)}
                    onDelete={() => setConfirmDeleteId(alert._id)}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {visible && (
        <AlertPagination
          totalItems={totalItems}
          perPage={perPage}
          page={page}
          onPageChange={setPage}
        />
      )}

      {!visible && (
        <Typography variant="body2" color="text.secondary">
          Výstrahy jsou skryté.
        </Typography>
      )}

      <ConfirmDeleteDialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />

      <Dialog
        open={Boolean(bulkDelete.confirmScope)}
        onClose={() => bulkDelete.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat výstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkDelete.confirmScope?.type === "selected"
              ? `Opravdu chcete smazat vybrané výstrahy? Po smazání se výstrahy nezobrazí v historii výstrah! (${bulkDelete.confirmScope.ids.length})`
              : `Opravdu chcete smazat výstrahy pro zvolený rozsah? Po smazání se výstrahy nezobrazí v historii výstrah!(${bulkDelete.confirmScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => bulkDelete.setConfirmScope(null)}>
            Zrušit
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={bulkDelete.confirmAction}
            disabled={bulkDelete.loading}
          >
            Smazat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(bulkResolve.confirmScope)}
        onClose={() => bulkResolve.setConfirmScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Potvrdit výstrahy?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {bulkResolve.confirmScope?.type === "selected"
              ? `Opravdu chcete potvrdit vybrané výstrahy? (${bulkResolve.confirmScope.ids.length})`
              : `Opravdu chcete potvrdit výstrahy pro zvolený rozsah? (${bulkResolve.confirmScope?.ids?.length ?? 0})`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => bulkResolve.setConfirmScope(null)}>
            Zrušit
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={bulkResolve.confirmAction}
            disabled={bulkResolve.loading}
          >
            Potvrdit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
