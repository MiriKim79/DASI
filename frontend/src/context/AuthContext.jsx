import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearAccessToken, getAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!getAccessToken()) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        if (isMounted) setUser(currentUser);
      } catch {
        clearAccessToken();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      setAuthenticatedUser: setUser,
      // 코인 잔액 등 서버 상태가 바뀐 뒤 상단바를 갱신할 때 호출한다.
      // 로그인 상태가 아니면 아무것도 하지 않는다.
      refreshUser: async () => {
        if (!getAccessToken()) return null;
        try {
          const currentUser = await api.getMe();
          setUser(currentUser);
          return currentUser;
        } catch {
          return null;
        }
      },
      logout: () => {
        clearAccessToken();
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
