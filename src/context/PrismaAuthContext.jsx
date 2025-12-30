import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const PrismaAuthContext = createContext(null);

export function PrismaAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // bạn có thể load từ bảng profiles sau
  const [loading, setLoading] = useState(true);

  // Load session lần đầu + listen auth changes
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error("[auth] getSession error:", error);
        setSession(data?.session ?? null);
        setLoading(false);
      })
      .catch((e) => {
        console.error("[auth] getSession exception:", e);
        setSession(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      // profile có thể reload ở đây nếu bạn muốn
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    // res = { data: { session, user }, error }
    if (!res.error) {
      setSession(res.data?.session ?? null);
    }
    return res;
  }, []);

  const signUp = useCallback(async (email, password, options = {}) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    // Note: nếu Supabase bật email confirm thì session có thể null cho tới khi confirm
    if (!res.error) {
      setSession(res.data?.session ?? null);
    }
    return res;
  }, []);

  const signOut = useCallback(async () => {
    const res = await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    return res;
  }, []);

  const user = session?.user || null;

  /**
   * Permissions / role:
   * - Hiện tại bạn chưa có logic role thật, nên mặc định "admin" để dự án không bị block.
   * - Khi bạn có bảng profiles/roles, mình sẽ giúp map lại chuẩn.
   */
  const role = "admin";
  const permissions = ["*"];

  const hasPermission = useCallback((perm) => {
    if (!perm) return true;
    if (permissions.includes("*")) return true;
    return permissions.includes(perm);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms = []) => {
    if (permissions.includes("*")) return true;
    return (perms || []).some((p) => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms = []) => {
    if (permissions.includes("*")) return true;
    return (perms || []).every((p) => permissions.includes(p));
  }, [permissions]);

  const contextValue = useMemo(
    () => ({
      session,
      profile,
      loading,
      user,
      role,
      permissions,

      // Auth functions (REAL)
      signIn,
      signUp,
      signOut,

      // Permission functions
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdmin: () => role === "admin",
      isUser: () => role === "user",
      isGuest: () => !user,
    }),
    [
      session,
      profile,
      loading,
      user,
      role,
      permissions,
      signIn,
      signUp,
      signOut,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  );

  return <PrismaAuthContext.Provider value={contextValue}>{children}</PrismaAuthContext.Provider>;
}

export function usePrismaAuth() {
  const context = useContext(PrismaAuthContext);
  if (!context) {
    throw new Error("usePrismaAuth must be used within a PrismaAuthProvider");
  }
  return context;
}
