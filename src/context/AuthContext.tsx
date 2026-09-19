"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types/sss";
import { authenticateOrRegisterUser } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_AUTH_KEY = "sss_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<User> => {
    const loggedUser = await authenticateOrRegisterUser(username, pass);
    setUser(loggedUser);
    localStorage.setItem(LS_AUTH_KEY, JSON.stringify(loggedUser));
    return loggedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
