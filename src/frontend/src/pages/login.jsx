import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { login } from "../services/authService.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      console.log("Přihlášený uživatel:", data);

      // tady můžeš:
      // - uložit token do localStorage / contextu
      // - přesměrovat na jinou stránku (např. dashboard)
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Přihlášení se nezdařilo. Zkuste to znovu."
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
    >
      <Typography variant="h4" mb={3}>
        Přihlášení
      </Typography>

      <Box component="form" onSubmit={handleSubmit} width="300px">
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Heslo"
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          type="submit"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? "Přihlašuji..." : "Přihlásit se"}
        </Button>

        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
          Nemáte účet? <Link to="/register">Registrujte se</Link>
        </Typography>
      </Box>
    </Box>
  );
}
