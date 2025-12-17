import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export async function login(email, password) {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  // response.data = { token, user }
  return response.data;
}

export async function registerUser({ email, password, name }) {
  const body = {
    email,
    password,
    name,
  };

  const response = await axios.post(`${API_URL}/register`, body, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

/**
 * Update user details.
 * @param {Object} payload - etc. { name, email, password }
 * @param {string} token
 */
export async function updateUser(userId, payload, token) {
  if (!userId) {
    throw new Error("userId je povinné");
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("Nejsou zadána žádná data k aktualizaci.");
  }

  const res = await axios.put(
    `${API_URL}/${encodeURIComponent(userId)}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}
