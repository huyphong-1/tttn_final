import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isUser,
  isGuest,
} from "../config/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser) => {
    if (!authUser?.id) {
      setProfile(null);
      return;
    }

    const userId = authUser.id;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile error:", error.message);
        setProfile(null);
        return;
      }

      if (!data) {
        const defaultProfile = {
          id: userId,
          email: authUser.email || "",
          full_name: authUser.user_metadata?.full_name || "",
          role: ROLES.USER,
          status: "active",
        };

        try {
          const { data: inserted, error: insertError } = await supabase
            .from("profiles")
            .insert([defaultProfile])
            .select()
            .single();

          if (insertError) {
            console.error("Unable to create profile:", insertError.message);
            setProfile(defaultProfile);
            return;
          }

          setProfile(inserted || defaultProfile);
          return;
        } catch (insertCatch) {
          console.error("fetchProfile insert catch:", insertCatch);
          setProfile(defaultProfile);
          return;
        }
      }

      setProfile(data);
    } catch (error) {
      console.error("fetchProfile catch error:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let finished = false;

    const finishLoading = () => {
      if (mounted && !finished) {
        finished = true;
        setLoading(false);
      }
    };

    const init = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("getSession error:", error.message);
        }

        const newSession = data?.session ?? null;
        if (!mounted) return;

        setSession(newSession);

        const authUser = newSession?.user;
        if (authUser) {
          fetchProfile(authUser);
        } else {
          setProfile(null);
        }

        finishLoading();
      } catch (error) {
        console.error("AuthContext init error:", error);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
        finishLoading();
      }
    };

    const timeoutId = setTimeout(() => {
      if (!finished && mounted) {
        console.warn("AuthContext: Timeout fallback - forcing loading to false");
        finishLoading();
      }
    }, 8000);

    init().finally(() => {
      clearTimeout(timeoutId);
      finishLoading();
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession ?? null);

      const authUser = newSession?.user;
      if (authUser) {
        fetchProfile(authUser);
      } else {
        setProfile(null);
      }

      finishLoading();
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
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

      hasPermission: (permission) => hasPermission(profile?.role, permission),
      hasAnyPermission: (permissions) => hasAnyPermission(profile?.role, permissions),
      hasAllPermissions: (permissions) => hasAllPermissions(profile?.role, permissions),

      signUp: (email, password) => supabase.auth.signUp({ email, password }),

      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),

      signOut: async () => {
        try {
          setLoading(true);

          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error("Supabase signOut error:", error);
          }

          try {
            localStorage.removeItem("shopsy_cart");
            localStorage.removeItem("techphone_wishlist");
          } catch (e) {
            console.warn("Error clearing localStorage:", e);
          }

          setSession(null);
          setProfile(null);
        } catch (error) {
          console.error("Error in signOut:", error);
          setSession(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      },
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
