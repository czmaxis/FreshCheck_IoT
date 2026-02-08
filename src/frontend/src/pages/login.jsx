import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import { login } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login: loginToContext } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // { token: "...", user: { ... } }
      const data = await login(email, password);

      // uložit do kontextu + localStorage
      loginToContext(data.token, data.user);

      // přesměrování na dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Přihlášení se nezdařilo. Zkuste to znovu.",
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
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background:
          "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1a81e9 0%, #3a3cd6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 12px rgba(39, 107, 175, 0.3)", //rgba(25, 118, 210, 0.3)
              }}
            >
              <LoginIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 1,
                background:
                  "linear-gradient(135deg,  #1a81e9 0%, #3a3cd6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.75rem", sm: "2.125rem" },
              }}
            >
              FreshCheck IoT
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Přihlaste se ke svému účtu
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Heslo"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              type="submit"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                background:
                  "linear-gradient(135deg,  #1a81e9 0%, #3a3cd6 100%)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Přihlašuji..." : "Přihlásit se"}
            </Button>

            <Box
              sx={{
                mt: 3,
                pt: 3,
                borderTop: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Nemáte účet?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#1976d2",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Registrujte se
                </Link>
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              borderRadius: 2,
              border: "1px solid rgba(25, 118, 210, 0.2)",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5, fontWeight: 600 }}
            >
              Demo přihlašovací údaje:
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "monospace" }}
            >
              Email: nette@example.com
              <br />
              Heslo: 123456
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
