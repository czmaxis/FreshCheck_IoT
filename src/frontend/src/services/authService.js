import axios from "axios";

const API_URL = "http://localhost:5001/auth";

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
