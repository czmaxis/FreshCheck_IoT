import axios from "axios";

const API_BASE = "http://localhost:5000";

export async function getSensorData(deviceId, token) {
  if (!deviceId) throw new Error("deviceId is required");

  const url = `${API_BASE}/sensordata/${encodeURIComponent(deviceId)}`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await axios.get(url, { headers });
  return resp.data;
}
