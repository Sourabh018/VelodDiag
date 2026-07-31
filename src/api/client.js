import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 30s — Render free tier cold start can take 20-30s
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;