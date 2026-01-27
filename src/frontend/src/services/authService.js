import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// LOGIN
export async function login(email, password) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  return response.data; // { token, user }
}

// REGISTER
export async function registerUser({ email, password, name }) {
  const response = await axios.post(
    `${API_URL}/auth/register`,
    { email, password, name },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

// UPDATE USER
export async function updateUser(userId, payload, token) {
  if (!userId) {
    throw new Error("userId je povinné");
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("Nejsou zadána žádná data k aktualizaci.");
  }

  const response = await axios.put(
    `${API_URL}/auth/${encodeURIComponent(userId)}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}
