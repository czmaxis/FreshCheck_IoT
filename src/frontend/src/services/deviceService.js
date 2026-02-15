import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function getDevices(token) {
  const url = `${API_BASE}/devices`;
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const resp = await axios.get(url, { headers });
  return resp.data;
}

export async function updateDevice(deviceId, payload, token) {
  const res = await axios.put(
    `${API_BASE}/devices/${deviceId}/update`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return res.data;
}

export async function createDevice(payload, token) {
  const res = await axios.post(`${API_BASE}/devices`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}

export async function deleteDevice(deviceId, token) {
  const res = await axios.delete(`${API_BASE}/devices/${deviceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
export async function getDevice(deviceId, token) {
  const res = await axios.get(`${API_BASE}/devices/${deviceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
