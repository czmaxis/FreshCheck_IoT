import React from "react";
import { Box, Button, MenuItem, TextField } from "@mui/material";

const DELETE_OPTIONS = [
  { label: "Smazat za poslední hodinu", value: "1h" },
  { label: "Smazat za posledních 6 hodin", value: "6h" },
  { label: "Smazat za posledních 24 hodin", value: "24h" },
  { label: "Smazat za poslední týden", value: "7d" },
  { label: "Smazat vše", value: "all" },
  { label: "Označit a smazat", value: "select" },
  { label: "Od–do", value: "custom" },
];

const RESOLVE_OPTIONS = [
  { label: "Potvrdit za poslední hodinu", value: "1h" },
  { label: "Potvrdit za posledních 6 hodin", value: "6h" },
  { label: "Potvrdit za posledních 24 hodin", value: "24h" },
  { label: "Potvrdit za poslední týden", value: "7d" },
  { label: "Potvrdit vše", value: "all" },
  { label: "Označit a potvrdit", value: "select" },
  { label: "Od–do", value: "custom" },
];

/**
 * ActionSelector - komponenta pro výběr a provádění akcí (mazání/potvrzování)
 *
 * @param {Object} props
 * @param {string} props.type - typ akce: "delete" nebo "resolve"
 * @param {boolean} props.selectionMode - zda je aktivní mód označování
 * @param {Set} props.selectedIds - množina vybraných ID
 * @param {boolean} props.loading - zda probíhá načítání
 * @param {Function} props.onRangeSelect - callback při výběru rozsahu z dropdownu
 * @param {Function} props.onConfirmSelection - callback při potvrzení výběru
 * @param {Function} props.onCancelSelection - callback při zrušení módu výběru
 */
export default function ActionSelector({
  type = "delete",
  selectionMode = false,
  selectedIds = new Set(),
  loading = false,
  onRangeSelect,
  onConfirmSelection,
  onCancelSelection,
}) {
  const isDelete = type === "delete";
  const options = isDelete ? DELETE_OPTIONS : RESOLVE_OPTIONS;
  const label = isDelete ? "Smazat" : "Potvrdit";
  const color = isDelete ? "error" : "primary";

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ width: { xs: "100%", sm: "auto" } }}
    >
      {!selectionMode ? (
        <TextField
          select
          size="small"
          label={label}
          color="primary"
          value=""
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            onRangeSelect?.(value);
          }}
          sx={{ minWidth: 180, width: { xs: "100%", sm: 200 } }}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Button
            variant="contained"
            color={color}
            size="small"
            onClick={onConfirmSelection}
            disabled={selectedIds.size === 0 || loading}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {label}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onCancelSelection}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Zrušit
          </Button>
        </Box>
      )}
    </Box>
  );
}

export { DELETE_OPTIONS, RESOLVE_OPTIONS };
