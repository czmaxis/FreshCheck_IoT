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
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { registerUser } from "../services/authService.js";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hesla se neshodují!");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ email, password, name });

      alert("Registrace proběhla úspěšně. Nyní se prosím přihlaste.");
      navigate("/login");
    } catch (err) {
      console.error("Chyba při registraci:", err);

      const serverData = err.response?.data;
      let serverMessage = null;

      if (serverData) {
        if (typeof serverData === "string") serverMessage = serverData;
        else if (serverData.message) serverMessage = serverData.message;
        else if (serverData.errors) {
          serverMessage = Array.isArray(serverData.errors)
            ? serverData.errors.join(", ")
            : JSON.stringify(serverData.errors);
        } else {
          serverMessage = JSON.stringify(serverData);
        }
      }

      setError(serverMessage || err.message || "Registrace selhala.");
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
          "linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(33, 150, 243, 0.05) 100%)",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
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
                background: "linear-gradient(135deg, #4caf50 0%, #2196f3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              }}
            >
              <HowToRegIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                mb: 1,
                background: "linear-gradient(135deg, #4caf50 0%, #2196f3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.75rem", sm: "2.125rem" },
              }}
            >
              Vytvořit účet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Zaregistrujte se a začněte používat FreshCheck IoT
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Jméno"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              variant="outlined"
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
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
              sx={{ mb: 2.5 }}
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
            <TextField
              fullWidth
              label="Potvrzení hesla"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                background: "linear-gradient(135deg, #4caf50 0%, #2196f3 100%)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "Registruji..." : "Vytvořit účet"}
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
                Už máte účet?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#2196f3",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Přihlaste se
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
