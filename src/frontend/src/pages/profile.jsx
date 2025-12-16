import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import NavBar from "./navBar.jsx";
import { updateUser } from "../services/authService.js";

export default function Profile() {
  const { user, token, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Box p={4}>
        <Typography variant="h5" color="error">
          Uživatel není přihlášen.
        </Typography>
      </Box>
    );
  }

  const handleEdit = () => {
    setEditing(true);
    setName(user.name);
    setEmail(user.email);
    setError("");
  };

  const handleCancel = () => {
    setEditing(false);
    setName(user.name);
    setEmail(user.email);
    setError("");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        name: name || user.name,
        email: email || user.email,
      };

      const res = await updateUser(user._id, payload, token);

      //  BEZPEČNÁ AKTUALIZACE USERA (nezávislá na tvaru response)
      const updatedUser = {
        ...user,
        ...payload,
      };

      setUser(updatedUser);

      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se uložit změny profilu."
      );
    } finally {
      setLoading(false);
    }
  };

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

          {!editing ? (
            <>
              <Typography variant="h5">{user.name}</Typography>

              <Typography variant="body1" color="text.secondary">
                Email: {user.email}
              </Typography>

              {user._id && (
                <Typography variant="body2" color="text.secondary">
                  ID uživatele: {user._id}
                </Typography>
              )}

              <Button variant="outlined" onClick={handleEdit}>
                Editovat
              </Button>
            </>
          ) : (
            <>
              <TextField
                label="Jméno"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />

              {error && (
                <Alert severity="error" sx={{ width: "100%" }}>
                  {error}
                </Alert>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                >
                  Uložit
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Zrušit
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
