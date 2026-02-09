export const COLOR_TEMPERATURE = "#ef5350";
export const COLOR_HUMIDITY = "#42a5f5";
export const COLOR_DOOR_OPEN = "#ff9800";
export const COLOR_DOOR_CLOSED = "#66bb6a";
export const COLOR_DEFAULT = "#9e9e9e";

export function chipSx(color) {
  return {
    backgroundColor: `${color}15`,
    border: `1px solid ${color}30`,
    fontWeight: 600,
    "& .MuiChip-icon": { color },
    "& .MuiChip-label": { color },
  };
}
