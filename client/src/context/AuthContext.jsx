import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("quizarena_token");
    const savedUser = localStorage.getItem("quizarena_user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const persistSession = (token, userData) => {
    localStorage.setItem("quizarena_token", token);
    localStorage.setItem("quizarena_user", JSON.stringify(userData));
    setUser(userData);
  };

  const registerStudent = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data.token, data.user);
    return data.user;
  };

  const loginStudent = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    persistSession(data.token, data.user);
    return data.user;
  };

  const loginAdmin = async (adminId, password) => {
    const { data } = await api.post("/auth/admin-login", { adminId, password });
    persistSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("quizarena_token");
    localStorage.removeItem("quizarena_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, registerStudent, loginStudent, loginAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
