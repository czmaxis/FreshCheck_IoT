import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import { getDevices } from "../services/deviceService.js"; // nebo getDevicesWithApi

export default function Dashboard() {
  const { user } = useAuth();
  const { token } = useAuth();
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        // zavoláme servis s tokenem z kontextu
        const data = await getDevices(token);
        setDevices(data);
      } catch (err) {
        console.error("Chyba při načítání zařízení:", err);
        setError(
          err.response?.data?.message || "Nepodařilo se načíst zařízení."
        );
      }
    }

    load();
  }, [token]);

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
      <p> </p>
      <Typography variant="h4" gutterBottom>
        Zařízení:
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <List>
        {devices && devices.length > 0 ? (
          devices.map((d) => (
            <ListItem key={d._id}>
              <ListItemText
                primary={d.name}
                secondary={`Typ: ${d.type} — Lokace: ${d.location}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography>Žádná zařízení k zobrazení.</Typography>
        )}
      </List>
    </Box>
  );
}
