"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { usePathname } from "next/navigation";
import { authApi } from "@/services/client-api";
import type {
  AuthResponse,
  GoogleAuthResponse,
  PasswordChangeResponse,
  ProfileUpdateResponse,
  RegisterResponse,
  User,
} from "@/lib/types";

type AuthPortal = "storefront" | "admin";

/**
 * Token markers used in state. Actual JWTs are never stored on the client.
 * Both portals now use httpOnly cookies managed by the server.
 *
 * - "cookie"        → storefront session (storefront_token cookie)
 * - "admin-cookie"  → admin session (admin_token cookie)
 */
const STOREFRONT_TOKEN_MARKER = "cookie";
const ADMIN_TOKEN_MARKER = "admin-cookie";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  initialized: boolean;
  loading: boolean;
  isAdmin: boolean;
  login: (payload: {
    email: string;
    password: string;
    portal?: "storefront" | "admin";
  }) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResponse>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<RegisterResponse>;
  verifyTotp: (payload: { tempToken: string; code: string; portal?: "storefront" | "admin" }) => Promise<void>;
  updateProfile: (payload: {
    firstName: string;
    lastName?: string;
    email: string;
  }) => Promise<ProfileUpdateResponse>;
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<PasswordChangeResponse>;
  logoutEverywhere: () => Promise<{ message: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolvePortal(pathname: string): AuthPortal {
  return pathname.startsWith("/admin") ? "admin" : "storefront";
}

function tokenMarkerFor(portal: AuthPortal) {
  return portal === "admin" ? ADMIN_TOKEN_MARKER : STOREFRONT_TOKEN_MARKER;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const currentPortal = resolvePortal(pathname);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const marker = tokenMarkerFor(currentPortal);

  const refreshSession = async () => {
    setLoading(true);

    try {
      // Pass the marker so apiRequest sends the correct portal header
      const response = await authApi.me(marker);

      if (response.user) {
        setUser(response.user);
        setToken(marker);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Hydrate session on mount / portal change
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    setUser(null);
    setToken(null);
    setLoading(true);
    setInitialized(false);

    void authApi
      .me(marker)
      .then((response) => {
        if (cancelled) return;

        if (response.user) {
          setUser(response.user);
          setToken(marker);
        } else {
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setInitialized(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPortal, marker]);

  const login = async (payload: {
    email: string;
    password: string;
    portal?: "storefront" | "admin";
  }) => {
    const response = await authApi.login(payload);
    const targetPortal = payload.portal ?? "storefront";

    if (!response.totpRequired && !response.totpSetupRequired) {
      // Cookie is set by the server for both portals, just update local state
      setUser(response.user);
      setToken(tokenMarkerFor(targetPortal));
    }

    return response;
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await authApi.googleLogin(credential);
    // Cookie set by server, just update state
    setUser(response.user);
    setToken(STOREFRONT_TOKEN_MARKER);
    return response;
  };

  const verifyTotp = async (payload: { tempToken: string; code: string; portal?: "storefront" | "admin" }) => {
    const response = await authApi.verifyTotp(payload.tempToken, payload.code);
    const targetPortal = payload.portal ?? "storefront";

    // Cookie is set by the server, just update local state
    setUser(response.user);
    setToken(tokenMarkerFor(targetPortal));
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const response = await authApi.register(payload);
    return response;
  };

  const updateProfile = async (payload: {
    firstName: string;
    lastName?: string;
    email: string;
  }) => {
    const response = await authApi.updateProfile(marker, payload);

    // Cookie refreshed by server, just update local state
    setUser(response.user);

    return response;
  };

  const logout = () => {
    if (currentPortal === "admin") {
      void authApi.adminLogout().catch(() => {});
    } else {
      void authApi.logout().catch(() => {});
    }

    setUser(null);
    setToken(null);
  };

  const changePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await authApi.changePassword(marker, payload);

    // Cookie refreshed by server, just update local state
    setUser(response.user);

    return response;
  };

  const logoutEverywhere = async () => {
    const response = await authApi.logoutEverywhere(marker);
    setToken(null);
    setUser(null);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        loading,
        isAdmin: user?.role === "ADMIN",
        login,
        loginWithGoogle,
        register,
        verifyTotp,
        updateProfile,
        changePassword,
        logoutEverywhere,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider.");
  }

  return context;
}
