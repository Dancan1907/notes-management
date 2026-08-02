// frontend/src/providers/auth-provider.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { isAxiosError } from "axios";
import api from "@/lib/axios";
import { getToken, setToken, setRefreshToken, clearAuth } from "@/lib/auth";

// ─── Types ──────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  verify2fa: (code: string, tempToken: string) => Promise<void>;
  isAuthenticated: boolean;
}

// ─── Context ────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        clearAuth();
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    if (data.twoFactorRequired) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = new Error("2FA required") as any;
      error.twoFactorRequired = true;
      error.tempToken = data.tempToken;
      throw error;
    }

    const { access_token, refresh_token, user } = data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      name,
    });
    const { access_token, refresh_token, user } = response.data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.warn("Logout request failed:", error.response?.data?.message);
      }
    } finally {
      clearAuth();
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const verify2fa = async (code: string, tempToken: string) => {
    const response = await api.post("/2fa/verify", { code, tempToken });
    const { access_token, refresh_token, user } = response.data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verify2fa,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
