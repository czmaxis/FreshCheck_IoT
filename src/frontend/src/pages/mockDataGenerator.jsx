import { Box, Typography, Alert } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";

import MockDataForm from "../components/MockDataForm.jsx";
import { useMockDataGenerator } from "../hooks/useMockDataGenerator.js";

export default function MockDataGenerator() {
  const hook = useMockDataGenerator();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      minHeight="100vh"
      p={{ xs: 1.5, sm: 2 }}
      sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}
    >
      <Box mt={3} sx={{ width: "100%", maxWidth: 900 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c4dff 0%, #448aff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ScienceIcon sx={{ color: "white", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Generátor testovacích dat
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vygenerujte mockup senzorová data a uložte je do databáze
            </Typography>
          </Box>
        </Box>

        <MockDataForm {...hook} />

        {/* Result alert */}
        {hook.result && (
          <Alert
            severity={hook.result.type}
            icon={<ScienceIcon />}
            onClose={() => hook.setResult(null)}
            sx={{
              mt: 3,
              mb: 4,
              borderRadius: 3,
              "& .MuiAlert-icon": { alignItems: "center" },
            }}
          >
            {hook.result.message}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
