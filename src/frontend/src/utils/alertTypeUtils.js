import ThermostatIcon from "@mui/icons-material/Thermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import {
  COLOR_TEMPERATURE,
  COLOR_HUMIDITY,
  COLOR_DOOR_OPEN,
  COLOR_DEFAULT,
} from "../constants/colors.js";

export function getAccentColor(type) {
  switch (type) {
    case "temperature":
      return COLOR_TEMPERATURE;
    case "humidity":
      return COLOR_HUMIDITY;
    case "door":
    case "doorOpen":
      return COLOR_DOOR_OPEN;
    default:
      return COLOR_DEFAULT;
  }
}

export function getUnit(type) {
  if (type === "temperature") return " °C";
  if (type === "humidity") return " %";
  if (type === "door" || type === "doorOpen") return " s";
  return "";
}

export function getValueIcon(type) {
  if (type === "temperature") return <ThermostatIcon />;
  if (type === "humidity") return <WaterDropIcon />;
  if (type === "door" || type === "doorOpen") return <DoorFrontIcon />;
  return null;
}

export function formatThreshold(group) {
  const t = group.threshold;
  if (!t) return null;

  if (group.type === "temperature") {
    const min = t?.temperature?.min;
    const max = t?.temperature?.max;
    if (min == null && max == null) return null;
    if (min != null && max != null) return `Limit teploty ${min}–${max} °C`;
    if (min != null) return `Limit teploty ≥ ${min} °C`;
    return `Limit teploty ≤ ${max} °C`;
  }

  if (group.type === "humidity") {
    const min = t?.humidity?.min;
    const max = t?.humidity?.max;
    if (min == null && max == null) return null;
    if (min != null && max != null) return `Limit vlhkosti ${min}–${max} %`;
    if (min != null) return `Limit vlhkosti ≥ ${min} %`;
    return `Limit vlhkosti ≤ ${max} %`;
  }

  return null;
}
