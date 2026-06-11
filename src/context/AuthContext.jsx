import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { loginUser, registerUser } from "../services/usersService";

const AuthContext = createContext(null);
const STORAGE_KEY = "rawstock.currentUser";

// DEV-ONLY bypass: skip login and act as a fake admin for UI work.
const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
const DEV_USER = {
  id: "dev",
  username: "dev",
  full_name: "Dev User",
  role: "admin",
  status: "approved",
};

function readStoredUser() {
  if (DEV_BYPASS) return DEV_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const user = JSON.parse(raw);

    if (user.status !== "approved") {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Session without authentication: the "current user" is a row from the
 * public.users table, persisted in localStorage. Roles gate the UI only —
 * admins manage users; technicians get everything except user management.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback((u) => {
    setUser(u);
    if (u?.status === "approved") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(
    async (username, password) => {
      const u = await loginUser(username, password);
      persist(u);
      return u;
    },
    [persist]
  );

  const register = useCallback(async (values) => {
    return await registerUser(values);
  }, []);

  const logout = useCallback(() => persist(null), [persist]);

  const can = useCallback(
    (perm) => {
      if (!user) return false;

      if (user.role === "admin") return true;

      if (user.role === "technician") {
        return perm !== "users:manage";
      }

      return false;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      profile: user,
      role: user?.role || null,
      loading: false,
      isAuthenticated: Boolean(user),
      configured: isSupabaseConfigured,
      can,
      login,
      register,
      logout,
    }),
    [user, can, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
