import React from "react";
import { Box, Typography, Slider, Chip } from "@mui/material";

export default function ChartZoomSlider({
  localZoom,
  dataBounds,
  formatSliderTime,
  onSliderChange,
  isPending,
}) {
  const sliderValue = localZoom ?? [dataBounds.minTs, dataBounds.maxTs];

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: "#f5f5f5",
        border: "1px solid #e0e0e0",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        fontWeight={500}
        sx={{ mb: 1.5 }}
      >
        📊 Posuň výběr pro přiblížení/oddálení časového úseku grafů
      </Typography>

      <Slider
        value={sliderValue}
        min={dataBounds.minTs}
        max={dataBounds.maxTs}
        step={60 * 1000}
        disableSwap
        valueLabelDisplay="auto"
        valueLabelFormat={formatSliderTime}
        onChange={onSliderChange}
        disabled={dataBounds.minTs === dataBounds.maxTs}
        sx={{
          px: 1,
          mt: 0.5,
          "& .MuiSlider-thumb": {
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          },
        }}
      />

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1 }}
      >
        <Chip
          label={`Od: ${formatSliderTime(sliderValue[0])}`}
          size="small"
          sx={{
            backgroundColor: "white",
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
        <Chip
          label={`Do: ${formatSliderTime(sliderValue[1])}`}
          size="small"
          sx={{
            backgroundColor: "white",
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
      </Box>
      {isPending && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: "block", textAlign: "center" }}
        >
          Aplikují se změny…
        </Typography>
      )}
    </Box>
  );
}
