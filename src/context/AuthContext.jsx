import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isUser, isGuest } from "../config/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,role,full_name,phone,address,city")
        .eq("id", userId)
        .maybeSingle(); // ✅ không crash nếu chưa có row

      if (error) {
        console.error("fetchProfile error:", error.message);
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
    } catch (error) {
      console.error("fetchProfile catch error:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        console.log('AuthContext: Initializing...');

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("getSession error:", error.message);
        }

        const newSession = data?.session ?? null;
        if (!mounted) return;

        console.log('AuthContext: Session loaded:', !!newSession?.user);
        setSession(newSession);

        const userId = newSession?.user?.id;
        if (userId) {
          console.log('AuthContext: Fetching profile for user:', userId);
          await fetchProfile(userId);
        } else {
          console.log('AuthContext: No user, setting profile to null');
          setProfile(null);
        }

        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext init error:', error);
        if (mounted) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Timeout fallback để đảm bảo loading được reset
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('AuthContext: Timeout fallback - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 giây timeout

    init().finally(() => {
      clearTimeout(timeoutId);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (!mounted) return;
        
        setSession(newSession ?? null);

        const userId = newSession?.user?.id;
        if (userId) {
          await fetchProfile(userId);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
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
      role: profile?.role ?? ROLES.GUEST,
      isAdmin: isAdmin(profile?.role),
      isUser: isUser(profile?.role),
      isGuest: isGuest(profile?.role),
      loading,

      // Permission checking functions
      hasPermission: (permission) => hasPermission(profile?.role, permission),
      hasAnyPermission: (permissions) => hasAnyPermission(profile?.role, permissions),
      hasAllPermissions: (permissions) => hasAllPermissions(profile?.role, permissions),

      // Các hàm xác thực
      signUp: (email, password) =>
        supabase.auth.signUp({ email, password }),

      signIn: (email, password) =>
        supabase.auth.signInWithPassword({ email, password }),

      signOut: async () => {
        try {
          // Reset state trước khi gọi API
          setLoading(true);
          setSession(null);
          setProfile(null);
          
          // Gọi API đăng xuất
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Supabase signOut error:', error);
            // Vẫn tiếp tục reset state local ngay cả khi API lỗi
          }
          
          // Clear tất cả localStorage
          try {
            localStorage.removeItem('shopsy_cart');
            localStorage.removeItem('techphone_wishlist');
            localStorage.clear(); // Clear toàn bộ localStorage
          } catch (e) {
            console.warn('Error clearing localStorage:', e);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error in signOut:', error);
          // Vẫn reset state ngay cả khi có lỗi
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
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
