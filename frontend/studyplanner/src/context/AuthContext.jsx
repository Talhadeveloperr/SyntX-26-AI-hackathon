import { createContext, useState, useEffect } from "react";
import { UserModel } from "../models/userModel";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // INITIALIZE AUTH
  // =========================
  useEffect(() => {

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user_data");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.clear();
      }
    }

    setLoading(false);

  }, []);

  // =========================
  // LOGIN
  // =========================
  const loginUser = (responseData) => {

    const userData = new UserModel(responseData);

    localStorage.setItem("token", userData.token);

    localStorage.setItem(
      "user_data",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  // =========================
  // UPDATE USER
  // =========================
  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem("user_data", JSON.stringify(updated));
    setUser(updated);
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user_data");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginUser,
        logout,
        updateUser,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};