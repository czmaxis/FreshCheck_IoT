import React from "react";
import { Box, Skeleton } from "@mui/material";

export default function LimitsSkeleton({ lines = 1 }) {
  const count = Math.max(1, Number(lines) || 1);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" height={18} />
      ))}
    </Box>
  );
}
