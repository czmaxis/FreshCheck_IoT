import React from "react";
import { Box, Skeleton } from "@mui/material";

export default function AlertCardSkeleton({ count = 3 }) {
  const items = Math.max(1, Number(count) || 1);

  return (
    <Box>
      {Array.from({ length: items }).map((_, i) => (
        <Box
          key={i}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            backgroundColor: "#f7f7f7",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Skeleton variant="text" width={180} height={22} />
            <Skeleton variant="rounded" width={70} height={20} />
          </Box>
          <Skeleton variant="text" width="60%" height={18} />
          <Skeleton variant="text" width="40%" height={18} />
        </Box>
      ))}
    </Box>
  );
}
