// services/alertService.js
import axios from "axios";

const API_URL = "http://localhost:5001";

/**
 * Načte alerty pro zařízení
 */
export async function getAlerts(deviceId, options = {}, token) {
  if (!deviceId) {
    throw new Error("deviceId je povinný");
  }

  const params = {};
  if (options.active !== undefined) {
    params.active = options.active;
  }

  const res = await axios.get(
    `${API_URL}/alerts/${encodeURIComponent(deviceId)}`,
    {
      params,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return Array.isArray(res.data) ? res.data : [res.data];
}

/**
 * 🔹 Vyřeší alert (nastaví active = false)
 * @param {string} alertId
 * @param {string} token
 */
export async function resolveAlert(alertId, token) {
  if (!alertId) {
    throw new Error("alertId je povinný");
  }

  const res = await axios.put(
    `${API_URL}/alerts/${encodeURIComponent(alertId)}/resolve`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return res.data;
}
