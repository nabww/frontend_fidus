import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every request once the user is logged in
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("fidus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
