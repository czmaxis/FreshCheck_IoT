import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function getSensorData(deviceId, token) {
  const res = await axios.get(
    `${API_BASE}/sensordata/${encodeURIComponent(deviceId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  // backend může vracet objekt nebo pole
  return Array.isArray(res.data) ? res.data : [res.data];
}

export async function createSensorData(payload, token) {
  const res = await axios.post(`${API_BASE}/sensordata`, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

export async function deleteSensorData(id, token) {
  const res = await axios.post(
    `${API_BASE}/sensordata/${encodeURIComponent(id)}/delete`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  return res.data;
}
