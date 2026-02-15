import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { COLOR_TEMPERATURE, COLOR_DOOR_CLOSED, chipSx } from "../constants/colors.js";
import { getAccentColor, getUnit, getValueIcon, formatThreshold } from "../utils/alertTypeUtils.js";

import AlertCard from "./AlertCard.jsx";
import AlertCardSkeleton from "./AlertCardSkeleton.jsx";
import GroupConfirmDialog from "./GroupConfirmDialog.jsx";

export default function GroupedAlertCard({
  group,
  onResolve,
  onDelete,
  onBatchResolve,
  onBatchDelete,
  pendingIds,
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

  const accentColor = getAccentColor(group.type);
  const unit = getUnit(group.type);
  const thresholdText = formatThreshold(group);

  const valueLabel =
    group.minValue === group.maxValue
      ? `${group.minValue}${unit}`
      : `${group.minValue}–${group.maxValue}${unit}`;

  const oldest = new Date(group.oldestTimestamp).toLocaleString("cs-CZ");
  const latest = new Date(group.latestTimestamp).toLocaleString("cs-CZ");
  const timeLabel = oldest === latest ? oldest : `${oldest}  –  ${latest}`;

  const handleConfirm = async () => {
    const ids = group.alerts.map((a) => a._id);
    setBatchLoading(true);
    setBatchProgress({ done: 0, total: ids.length });
    try {
      if (confirmAction === "resolve") {
        await onBatchResolve(ids, (p) => setBatchProgress(p));
      } else if (confirmAction === "delete") {
        await onBatchDelete(ids, (p) => setBatchProgress(p));
      }
    } finally {
      setBatchLoading(false);
      setBatchProgress(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Box
        sx={{
          mb: 2,
          borderRadius: 3,
          borderLeft: `4px solid ${accentColor}`,
          backgroundColor: "background.paper",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* Group header */}
        <Box
          sx={{
            p: 2.5,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setExpanded((v) => !v)}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1.5}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: `${accentColor}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WarningAmberIcon
                  fontSize="small"
                  sx={{ color: accentColor }}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {group.title}
              </Typography>
              <Chip
                size="small"
                label={`${group.count}×`}
                sx={{
                  fontWeight: 700,
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                }}
              />
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  },
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                      minWidth: 200,
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setConfirmAction("resolve");
                  }}
                >
                  <ListItemIcon>
                    <CheckCircleIcon
                      fontSize="small"
                      sx={{ color: COLOR_DOOR_CLOSED }}
                    />
                  </ListItemIcon>
                  <ListItemText>
                    Potvrdit vše ({group.count})
                  </ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    setConfirmAction("delete");
                  }}
                >
                  <ListItemIcon>
                    <DeleteOutlineIcon
                      fontSize="small"
                      sx={{ color: COLOR_TEMPERATURE }}
                    />
                  </ListItemIcon>
                  <ListItemText sx={{ color: COLOR_TEMPERATURE }}>
                    Smazat vše ({group.count})
                  </ListItemText>
                </MenuItem>
              </Menu>

              <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
                {expanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Box>

          {/* Value range chip */}
          <Box sx={{ mb: 1.5, ml: 0.5 }}>
            <Chip
              icon={getValueIcon(group.type)}
              label={valueLabel}
              sx={{ ...chipSx(accentColor), fontSize: "0.95rem" }}
            />
          </Box>

          {/* Time range */}
          <Box display="flex" alignItems="center" gap={1} ml={0.5}>
            <AccessTimeIcon
              fontSize="small"
              sx={{ color: "text.secondary" }}
            />
            <Typography variant="body2" color="text.secondary">
              {timeLabel}
            </Typography>
          </Box>

          {/* Threshold */}
          {thresholdText && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, ml: 0.5 }}
            >
              {thresholdText}
            </Typography>
          )}
        </Box>

        {/* Expanded individual alerts */}
        <Collapse in={expanded}>
          <Box
            sx={{
              px: 2.5,
              pb: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              Jednotlivé výstrahy ({group.count})
            </Typography>
            {group.alerts.map((alert) =>
              pendingIds.includes(alert._id) ? (
                <AlertCardSkeleton key={alert._id} count={1} />
              ) : (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  onResolve={() => onResolve(alert._id)}
                  onDelete={() => onDelete(alert._id)}
                />
              ),
            )}
          </Box>
        </Collapse>
      </Box>

      <GroupConfirmDialog
        open={Boolean(confirmAction)}
        action={confirmAction}
        groupTitle={group.title}
        groupCount={group.count}
        loading={batchLoading}
        progress={batchProgress}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
