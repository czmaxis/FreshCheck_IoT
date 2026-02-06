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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import NavBar from "./navBar.jsx";
import { updateUser, changePassword } from "../services/authService.js";

export default function Profile() {
  const { user, token, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdOld, setPwdOld] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdNewConfirm, setPwdNewConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

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

  const openPasswordDialog = () => {
    setPwdOld("");
    setPwdNew("");
    setPwdNewConfirm("");
    setPwdError("");
    setPwdOpen(true);
  };

  const closePasswordDialog = () => {
    if (!pwdLoading) setPwdOpen(false);
  };

  const handleChangePassword = async () => {
    if (!pwdOld || !pwdNew || !pwdNewConfirm) {
      setPwdError("Vyplňte všechna pole.");
      return;
    }
    if (pwdNew !== pwdNewConfirm) {
      setPwdError("Nová hesla se neshodují.");
      return;
    }

    try {
      setPwdLoading(true);
      setPwdError("");
      await changePassword(
        { oldPassword: pwdOld, password: pwdNew },
        token,
      );
      setPwdOpen(false);
    } catch (err) {
      console.error("Password change error:", err);
      setPwdError(
        err.response?.data?.message || "Nepodařilo se změnit heslo.",
      );
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        minHeight="100vh"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
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

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={handleEdit}>
                    Editovat
                  </Button>
                  <Button variant="outlined" onClick={openPasswordDialog}>
                    Změnit heslo
                  </Button>
                </Stack>
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
      <Dialog open={pwdOpen} onClose={closePasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Změnit heslo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Staré heslo"
              type="password"
              value={pwdOld}
              onChange={(e) => setPwdOld(e.target.value)}
              fullWidth
            />
            <TextField
              label="Nové heslo"
              type="password"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              fullWidth
            />
            <TextField
              label="Nové heslo znovu"
              type="password"
              value={pwdNewConfirm}
              onChange={(e) => setPwdNewConfirm(e.target.value)}
              fullWidth
            />
            {pwdError && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {pwdError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog} disabled={pwdLoading}>
            Zrušit
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={pwdLoading}
          >
            Uložit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
