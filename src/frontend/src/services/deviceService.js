import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// 1) Jednoduchá funkce, která přijme token jako argument
export async function getDevices(token) {
  const url = `${API_BASE}/devices/`;
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const resp = await axios.get(url, { headers });
  return resp.data;
}

// 2) Axios instance, která použije token z localStorage (fallback)
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Volitelně: interceptor, který přidá Authorization header z localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    //localStorage nemusí být k dispozici v testech nebo SSR
  }
  return config;
});
export async function updateDevice(deviceId, payload, token) {
  const res = await axios.put(`${API_BASE}/devices/${deviceId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
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
export async function getDevicesWithApi() {
  const resp = await api.get("/devices/");
  return resp.data;
}
