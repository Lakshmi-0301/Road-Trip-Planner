import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/auth';

export const registerUser = async (username, email, password) => {
  const response = await axios.post(`${API_BASE}/register`, {
    username,
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE}/login`, {
    email,
    password,
  });
  return response.data;
};
