import React from "react";
import { Box, Typography, TextField, MenuItem } from "@mui/material";

/**
 * PerPageSelector - Komponenta pro výběr počtu položek na stránce
 *
 * @param {Object} props
 * @param {number} props.value - Aktuální hodnota (počet položek na stránce)
 * @param {Function} props.onChange - Callback pro změnu hodnoty
 * @param {Array<number>} props.options - Pole dostupných možností (výchozí: [1, 5, 10, 20])
 * @param {string} props.label - Label zobrazený před selectorem (výchozí: "Zobrazit")
 */
export default function PerPageSelector({
  value,
  onChange,
  options = [1, 5, 10, 20],
  label = "Na stránce",
}) {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ width: { xs: "100%", sm: "auto" } }}
    >
      <Typography variant="body2" color="text.secondary" whiteSpace="nowrap">
        {label}
      </Typography>
      <TextField
        select
        size="small"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        sx={{
          minWidth: 70,
          width: { xs: "100%", sm: 80 },
        }}
      >
        {options.map((n) => (
          <MenuItem key={n} value={n}>
            {n}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
