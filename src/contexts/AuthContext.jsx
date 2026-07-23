import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { auth as firebaseAuth } from "@/lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

const persistCompanyInfo = (info) => {
  if (info) {
    localStorage.setItem("companyInfo", JSON.stringify(info));
  }
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem("companyInfo");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!isLoggedIn) return;

    const syncFirebase = async () => {
      try {
        const { data } = await api.get('/auth/firebase-token');
        const token = data?.data?.firebaseToken || data?.firebaseToken;
        if (data.success && token) {
          await signInWithCustomToken(firebaseAuth, token);
        }
      } catch (error) {
        console.error("Failed to sync Firebase auth:", error);
      }
    };

    const refreshProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        if (data.success && data.data) {
          setCompanyInfo(data.data);
          persistCompanyInfo(data.data);
        }
      } catch (error) {
        console.error("Failed to refresh profile:", error);
      }
    };

    syncFirebase();
    refreshProfile();
  }, [isLoggedIn]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem("token", data.data.token);
      persistCompanyInfo(data.data.user);
      setIsLoggedIn(true);
      setCompanyInfo(data.data.user);
      // Consumed once by DashboardLayout to show a brief "Welcome back" banner
      // right after sign-in — not on every page load/refresh.
      sessionStorage.setItem("justLoggedIn", "1");
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (info) => {
    try {
      const { data } = await api.post('/auth/register', info);
      localStorage.setItem("token", data.data.token);
      persistCompanyInfo(data.data.user);
      setIsLoggedIn(true);
      setCompanyInfo(data.data.user);
      sessionStorage.setItem("justLoggedIn", "1");
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("companyInfo");
    setIsLoggedIn(false);
    setCompanyInfo(null);
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.error("Firebase logout error:", e);
    }
  };

  const deleteAccount = async () => {
    await api.delete('/auth/account');
    localStorage.removeItem("token");
    localStorage.removeItem("companyInfo");
    setIsLoggedIn(false);
    setCompanyInfo(null);
    try {
      await signOut(firebaseAuth);
    } catch (e) {
      console.error("Firebase logout error:", e);
    }
  };

  const updateCompanyInfo = async (info) => {
    try {
      const { data } = await api.put('/auth/profile', info);
      const updated = data.data;
      persistCompanyInfo(updated);
      setCompanyInfo(updated);
      return true;
    } catch (error) {
      console.error("Failed to update company info:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, companyInfo, login, register, logout, updateCompanyInfo, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
