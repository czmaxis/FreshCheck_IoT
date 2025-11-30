import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Hesla se neshodují!");
      return;
    }
    console.log("Email:", email, "Password:", password);
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
        Registrace
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
        <TextField
          fullWidth
          label="Potvrzení hesla"
          type="password"
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button variant="contained" type="submit" fullWidth sx={{ mt: 2 }}>
          Registrovat
        </Button>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Už máte účet? <Link to="/login">Přihlaste se</Link>
        </Typography>
      </Box>
    </Box>
  );
}
