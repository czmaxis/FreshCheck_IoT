export function parseDoorState(item) {
  if (item?.doors === true || item?.doors === 1 || item?.doors === "1") {
    return 1;
  }
  if (item?.doors === false || item?.doors === 0 || item?.doors === "0") {
    return 0;
  }

  const illuminance = item?.illuminance;
  if (illuminance === undefined || illuminance === null) return null;
  if (Number.isNaN(Number(illuminance))) return null;
  return Number(illuminance) > 0 ? 1 : 0;
}

export function getDoorStateFromItem(item) {
  const state = parseDoorState(item);
  if (state == null) return { label: "\u2014", color: "default" };
  if (state === 0) return { label: "Zav\u0159eno", color: "success" };
  return { label: "Otev\u0159eno", color: "warning" };
}
