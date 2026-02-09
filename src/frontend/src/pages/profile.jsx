import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "../context/AuthContext.jsx";
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

      const updatedUser = {
        ...user,
        ...payload,
      };

      setUser(updatedUser);

      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(
        err.response?.data?.message || "Nepodařilo se uložit změny profilu.",
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
      await changePassword({ oldPassword: pwdOld, password: pwdNew }, token);
      setPwdOpen(false);
    } catch (err) {
      console.error("Password change error:", err);
      setPwdError(err.response?.data?.message || "Nepodařilo se změnit heslo.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="flex-start"
        minHeight="100vh"
        p={{ xs: 2, sm: 3 }}
        sx={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            width: "100%",
            mt: { xs: 2, sm: 4 },
          }}
        >
          {/* Header Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
              >
                <Avatar
                  sx={{
                    width: { xs: 96, sm: 120 },
                    height: { xs: 96, sm: 120 },
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    },
                  }}
                  alt={user.name}
                  src={user.avatar || ""}
                />

                <Box textAlign="center">
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: { xs: "1.75rem", sm: "2.125rem" },
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  Informace o profilu
                </Typography>
                {!editing && (
                  <IconButton
                    onClick={handleEdit}
                    size="small"
                    sx={{
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {!editing ? (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Jméno
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 0.5, fontWeight: 500 }}
                    >
                      {user.name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Email
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ mt: 0.5, fontWeight: 500 }}
                    >
                      {user.email}
                    </Typography>
                  </Box>

                  {user._id && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        ID uživatele
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          fontFamily: "monospace",
                          color: "text.secondary",
                        }}
                      >
                        {user._id}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  <TextField
                    label="Jméno"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />

                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />

                  {error && (
                    <Alert severity="error" sx={{ width: "100%" }}>
                      {error}
                    </Alert>
                  )}

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Zrušit
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      Uložit
                    </Button>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  Zabezpečení
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, lineHeight: 1.6 }}
                >
                  Chraňte svůj účet změnou hesla pravidelně. Používejte silné
                  heslo s kombinací písmen, čísel a speciálních znaků.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={openPasswordDialog}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  Změnit heslo
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Dialog
        open={pwdOpen}
        onClose={closePasswordDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            pb: 1,
          }}
        >
          Změnit heslo
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Staré heslo"
              type="password"
              value={pwdOld}
              onChange={(e) => setPwdOld(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Nové heslo"
              type="password"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Nové heslo znovu"
              type="password"
              value={pwdNewConfirm}
              onChange={(e) => setPwdNewConfirm(e.target.value)}
              fullWidth
              variant="outlined"
            />
            {pwdError && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {pwdError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={closePasswordDialog}
            disabled={pwdLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Zrušit
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={pwdLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            Uložit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
