import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("quizarena_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle common authentication errors
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.error("Authentication failed:", error.response.data);

      // Optional: remove invalid token
      // localStorage.removeItem("quizarena_token");
    }

    if (error.response?.status === 403) {
      console.error("Permission denied:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;