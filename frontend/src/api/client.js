import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cross-origin cookies (SameSite=None; Secure)
});

export default client;
