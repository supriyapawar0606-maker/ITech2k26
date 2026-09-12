import axios from "axios";

// ======================================================
// AXIOS API CONFIGURATION
// ======================================================

// For local development:
// VITE_API_URL=http://localhost:5000/api

// For Render deployment:
// VITE_API_URL=https://itech2k26.onrender.com/api

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Display the API URL in the browser console
console.log("QuizArena API URL:", API_BASE_URL);

// ======================================================
// REQUEST INTERCEPTOR
// Automatically attach JWT token to every request
// ======================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("quizarena_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ======================================================
// RESPONSE INTERCEPTOR
// Handle common API errors
// ======================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (!error.response) {
      console.error("Network error. Please check your backend server.");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        console.error("Bad request:", data);
        break;

      case 401:
        console.error("Authentication failed:", data);

        // Do not remove the token automatically.
        // Some protected requests may temporarily fail.
        // localStorage.removeItem("quizarena_token");
        break;

      case 403:
        console.error("Permission denied:", data);
        break;

      case 404:
        console.error("API route not found:", data);
        break;

      case 409:
        console.error("Conflict error:", data);
        break;

      case 500:
        console.error("Server error:", data);
        break;

      default:
        console.error(`API error ${status}:`, data);
    }

    return Promise.reject(error);
  }
);

export default api;