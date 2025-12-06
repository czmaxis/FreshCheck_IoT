import React from "react";
import { Typography, Box } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="h4" gutterBottom>
        Vítej na dashboardu!
      </Typography>

      {user ? (
        <Typography variant="h5">Přihlášený uživatel: {user.name}</Typography>
      ) : (
        <Typography variant="h6" color="error">
          Uživatel není přihlášen.
        </Typography>
      )}
    </Box>
  );
}
