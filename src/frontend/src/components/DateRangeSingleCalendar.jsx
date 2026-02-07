import React, { useMemo, useState } from "react";
import { Box, Button, Popover, TextField, Typography } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import "dayjs/locale/cs";

export default function DateRangeSingleCalendar({
  value,
  onChange,
  label = "Období",
  size = "small",
  fullWidth = false,
  textFieldSx = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [start, end] = value || [null, null];

  const displayValue = useMemo(() => {
    if (!start && !end) return "";
    const startText = start ? dayjs(start).format("YYYY-MM-DD") : "";
    const endText = end ? dayjs(end).format("YYYY-MM-DD") : "";
    return `${startText} – ${endText}`;
  }, [start, end]);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (newDate) => {
    if (!newDate) return;
    const picked = dayjs(newDate).startOf("day");

    if (!start || (start && end)) {
      onChange([picked, null]);
      return;
    }

    const startDay = dayjs(start).startOf("day");
    if (picked.isBefore(startDay, "day")) {
      onChange([picked, null]);
      return;
    }

    onChange([startDay, picked]);
    handleClose();
  };

  const handleClear = () => onChange([null, null]);

  return (
    <Box>
      <TextField
        label={label}
        size={size}
        value={displayValue}
        onClick={handleOpen}
        inputProps={{ readOnly: true }}
        fullWidth={fullWidth}
        sx={{
          minWidth: fullWidth ? 0 : 220,
          width: fullWidth ? "100%" : "auto",
          ...textFieldSx,
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Vyber datum od–do
          </Typography>
          <DateCalendar
            value={end || start}
            onChange={handleSelect}
            dayOfWeekFormatter={(day) => dayjs(day).locale("cs").format("dd")}
          />
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button size="small" onClick={handleClear}>
              Vyčistit
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
