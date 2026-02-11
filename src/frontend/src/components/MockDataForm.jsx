import React from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Card,
  CardContent,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/cs";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import TuneIcon from "@mui/icons-material/Tune";
import DevicesIcon from "@mui/icons-material/Devices";

import {
  COLOR_TEMPERATURE,
  COLOR_HUMIDITY,
  COLOR_DOOR_OPEN,
} from "../constants/colors.js";

export default function MockDataForm({
  devices,
  devicesLoading,
  selectedDeviceId,
  setSelectedDeviceId,
  count,
  setCount,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  tempRange,
  setTempRange,
  humRange,
  setHumRange,
  doorOpenChance,
  setDoorOpenChance,
  saving,
  progress,
  handleGenerate,
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#7c4dff15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TuneIcon fontSize="small" sx={{ color: "#7c4dff" }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Nastavení generování
          </Typography>
        </Box>

        <Stack spacing={3}>
          {/* Device selector */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DevicesIcon fontSize="small" sx={{ color: "#1976d2" }} />
              <Typography variant="body2" fontWeight={600}>
                Cílové zařízení
              </Typography>
            </Box>
            {devicesLoading ? (
              <Box display="flex" alignItems="center" gap={1.5}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Načítání zařízení…
                </Typography>
              </Box>
            ) : (
              <FormControl fullWidth variant="outlined">
                <InputLabel id="mock-device-select-label">Zařízení</InputLabel>
                <Select
                  labelId="mock-device-select-label"
                  value={selectedDeviceId}
                  label="Zařízení"
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={saving}
                >
                  {devices.length > 0 ? (
                    devices.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} — {d.location}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      Žádná zařízení
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Count */}
          <TextField
            label="Počet datových bodů"
            type="number"
            value={count}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 0 && v <= 10000) setCount(v);
            }}
            variant="outlined"
            fullWidth
            disabled={saving}
            inputProps={{ min: 1, max: 10000 }}
            helperText="1 – 10 000 datových bodů"
          />

          {/* Date range */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="cs">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DatePicker
                label="Od"
                value={dateFrom}
                onChange={(v) => v && setDateFrom(v)}
                maxDate={dateTo}
                disabled={saving}
                slotProps={{
                  textField: { fullWidth: true, variant: "outlined" },
                }}
              />
              <DatePicker
                label="Do"
                value={dateTo}
                onChange={(v) => v && setDateTo(v)}
                minDate={dateFrom}
                disabled={saving}
                slotProps={{
                  textField: { fullWidth: true, variant: "outlined" },
                }}
              />
            </Stack>
          </LocalizationProvider>

          {/* Temperature range */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DeviceThermostatIcon
                fontSize="small"
                sx={{ color: COLOR_TEMPERATURE }}
              />
              <Typography variant="body2" fontWeight={600}>
                Rozsah teploty: {tempRange[0]}°C – {tempRange[1]}°C
              </Typography>
            </Box>
            <Slider
              value={tempRange}
              onChange={(_, v) => setTempRange(v)}
              min={-30}
              max={50}
              step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}°C`}
              disableSwap
              disabled={saving}
              sx={{
                color: COLOR_TEMPERATURE,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                },
              }}
            />
          </Box>

          {/* Humidity range */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <OpacityIcon fontSize="small" sx={{ color: COLOR_HUMIDITY }} />
              <Typography variant="body2" fontWeight={600}>
                Rozsah vlhkosti: {humRange[0]}% – {humRange[1]}%
              </Typography>
            </Box>
            <Slider
              value={humRange}
              onChange={(_, v) => setHumRange(v)}
              min={0}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              disableSwap
              disabled={saving}
              sx={{
                color: COLOR_HUMIDITY,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                },
              }}
            />
          </Box>

          {/* Door open chance */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DoorFrontIcon
                fontSize="small"
                sx={{ color: COLOR_DOOR_OPEN }}
              />
              <Typography variant="body2" fontWeight={600}>
                Pravděpodobnost otevřených dveří: {doorOpenChance}%
              </Typography>
            </Box>
            <Slider
              value={doorOpenChance}
              onChange={(_, v) => setDoorOpenChance(v)}
              min={0}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}%`}
              disabled={saving}
              sx={{
                color: COLOR_DOOR_OPEN,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                },
              }}
            />
          </Box>

          {/* Generate button */}
          <Button
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={handleGenerate}
            disabled={saving || !selectedDeviceId}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              py: 1.2,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              background:
                "linear-gradient(135deg, #7c4dff 0%, #448aff 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #651fff 0%, #2979ff 100%)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              },
              "&.Mui-disabled": {
                background: "#bdbdbd",
              },
            }}
          >
            {saving
              ? `Ukládání… ${progress}%`
              : `Vygenerovat a uložit ${count} záznamů`}
          </Button>

          {/* Progress bar */}
          {saving && (
            <Box sx={{ width: "100%" }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background:
                      "linear-gradient(135deg, #7c4dff 0%, #448aff 100%)",
                  },
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, textAlign: "center" }}
              >
                Ukládání záznamu {Math.round((progress / 100) * count)} z{" "}
                {count}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
