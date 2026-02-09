import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import AlertCard from "./AlertCard.jsx";
import AlertFilters from "./AlertFilters.jsx";
import AlertPagination from "./AlertPagination.jsx";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.jsx";
import AlertCardSkeleton from "./AlertCardSkeleton.jsx";
import PerPageSelector from "./PerPageSelector.jsx";
import BulkActionControls from "./BulkActionControls.jsx";
import BulkConfirmDialogs from "./BulkConfirmDialogs.jsx";

import { useAlerts } from "../hooks/useAlerts.js";
import { useBulkActions } from "../hooks/useBulkActions.js";
import { useAlertFiltering } from "../hooks/useAlertFiltering.js";
import { PER_PAGE_OPTIONS_ACTIVE } from "../utils/dateRangeUtils.js";

export default function Alerts({ activeAlerts, setAllAlerts, deviceId }) {
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
  } = useAlerts(activeAlerts, setAllAlerts);

  const bulkDelete = useBulkActions(alerts, handleDeleteSelection);
  const bulkResolve = useBulkActions(alerts, handleResolveSelection);

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
    bulkDelete.resetAll();
    bulkResolve.resetAll();
  }, [deviceId, bulkDelete.resetAll, bulkResolve.resetAll]);

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
          <BulkActionControls
            bulkResolve={bulkResolve}
            bulkDelete={bulkDelete}
            isMobile={isMobile}
          />

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
                    checked={bulkResolve.selectedIds.has(alert._id)}
                    onChange={(e) => {
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

      <BulkConfirmDialogs bulkDelete={bulkDelete} bulkResolve={bulkResolve} />
    </Box>
  );
}
