import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

export async function getSensorData(deviceId, token) {
  const res = await axios.get(
    `${API_BASE}/sensordata/${encodeURIComponent(deviceId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  // backend může vracet objekt nebo pole
  return Array.isArray(res.data) ? res.data : [res.data];
}
