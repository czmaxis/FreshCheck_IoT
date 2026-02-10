import React from "react";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <Box
      key={location.pathname}
      sx={{
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          from: { opacity: 0.3 },
          to: { opacity: 1 },
        },
      }}
    >
      {children}
    </Box>
  );
}
