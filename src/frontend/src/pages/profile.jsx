import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import NavBar from "./navBar.jsx";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box p={4}>
        <Typography variant="h5" color="error">
          Uživatel není přihlášen.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      minHeight="100vh"
      p={2}
    >
      <NavBar />
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Avatar
            sx={{ width: 80, height: 80 }}
            alt={user.name}
            src={user.avatar || ""}
          />

          <Typography variant="h5">{user.name}</Typography>

          <Typography variant="body1" color="text.secondary">
            Email: {user.email}
          </Typography>

          {user._id && (
            <Typography variant="body2" color="text.secondary">
              ID uživatele: {user._id}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
