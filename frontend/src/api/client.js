import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach session token from localStorage on every request (cross-origin deployments)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("coread_session");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default client;
