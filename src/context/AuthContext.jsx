import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) return setProfile(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,role")
      .eq("id", userId)
      .maybeSingle(); // ✅ không crash nếu chưa có row

    if (error) {
      console.error("fetchProfile error:", error.message);
      setProfile(null);
      return;
    }

    setProfile(data ?? null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("getSession error:", error.message);

      const newSession = data?.session ?? null;
      if (!mounted) return;

      setSession(newSession);

      const userId = newSession?.user?.id;
      if (userId) await fetchProfile(userId);
      else setProfile(null);

      if (mounted) setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession ?? null);
        setLoading(false);

        const userId = newSession?.user?.id;
        if (userId) await fetchProfile(userId);
        else setProfile(null);
      }
    );

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? "guest",
      isAdmin: profile?.role === "admin",
      loading,

      // Các hàm xác thực
      signUp: (email, password) =>
        supabase.auth.signUp({ email, password }),

      signIn: (email, password) =>
        supabase.auth.signInWithPassword({ email, password }),

      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);  // Reset session khi đăng xuất
        setProfile(null);  // Reset profile khi đăng xuất
      },
    }),
    [session, profile, loading]  // Chỉ re-render khi session, profile hoặc loading thay đổi
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
