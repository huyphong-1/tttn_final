import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, getCachedSession } from "../lib/supabase";
import {
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isUser,
  isGuest,
} from "../config/permissions";
import { isAdminEmail } from "../config/adminConfig";

const AuthContext = createContext(null);
let hasWarnedSessionSlow = false;

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
        // Kiểm tra xem có phải admin email không
        const isAdmin = isAdminEmail(authUser.email);
        
        const defaultProfile = {
          id: userId,
          email: authUser.email || "",
          full_name: authUser.user_metadata?.full_name || "",
          role: isAdmin ? ROLES.ADMIN : ROLES.USER,
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
      } else {
        const isAdminAccount = isAdminEmail(authUser.email);

        // Keep admin role in sync with configured admin emails
        if (isAdminAccount && data.role !== ROLES.ADMIN) {
          try {
            const { data: updated, error: updateError } = await supabase
              .from("profiles")
              .update({ role: ROLES.ADMIN })
              .eq("id", userId)
              .select()
              .single();

            if (updateError) {
              console.error("Unable to update profile role:", updateError.message);
              setProfile(data);
            } else {
              setProfile(updated);
            }
          } catch (updateErr) {
            console.error("Error updating profile:", updateErr);
            setProfile(data);
          }
        } else if (!isAdminAccount && data.role === ROLES.ADMIN) {
          try {
            const { data: updated, error: updateError } = await supabase
              .from("profiles")
              .update({ role: ROLES.USER })
              .eq("id", userId)
              .select()
              .single();

            if (updateError) {
              console.error("Unable to update profile role:", updateError.message);
              setProfile(data);
            } else {
              setProfile(updated);
            }
          } catch (updateErr) {
            console.error("Error updating profile:", updateErr);
            setProfile(data);
          }
        } else {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error("fetchProfile catch error:", error);
      setProfile(null);
    }
  };

  const updateLastLogin = async (authUser) => {
    if (!authUser?.id) return;
    const lastLogin = new Date().toISOString();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ last_login: lastLogin })
        .eq("id", authUser.id);

      if (error) {
        console.warn("updateLastLogin error:", error.message);
        return;
      }

      setProfile((prev) =>
        prev?.id === authUser.id ? { ...prev, last_login: lastLogin } : prev
      );
    } catch (error) {
      console.warn("updateLastLogin catch:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let finished = false;
    let sessionTimeoutId;
    let hardTimeoutId;

    const finishLoading = () => {
      if (mounted && !finished) {
        finished = true;
        setLoading(false);
      }
    };

    const resolveSession = (session, event) => {
      if (session) return session;
      if (event === "SIGNED_OUT") return null;
      const cached = getCachedSession?.();
      return cached || null;
    };

    const handleSession = (data, error) => {
      if (error) {
        const message = (error.message || "").toLowerCase();
        if (message.includes("timeout")) {
          console.warn("getSession timeout - continuing without blocking");
        } else {
          console.error("getSession error:", error.message);
        }
      }

      const newSession = data?.session ?? null;
      const resolvedSession = resolveSession(newSession);
      if (!mounted) return;

      setSession(resolvedSession);

      const authUser = resolvedSession?.user;
      if (authUser) {
        fetchProfile(authUser);
      } else {
        setProfile(null);
      }

      finishLoading();
    };

    const init = () => {
      try {
        setLoading(true);

        const cachedSession = getCachedSession?.();
        if (cachedSession?.user && mounted) {
          setSession(cachedSession);
          fetchProfile(cachedSession.user);
          finishLoading();
        }

        const sessionPromise = supabase.auth.getSession();
        sessionTimeoutId = setTimeout(() => {
          if (!finished && mounted) {
            if (!hasWarnedSessionSlow && import.meta.env.DEV) {
              hasWarnedSessionSlow = true;
              console.warn("AuthContext: getSession is slow, continuing without blocking");
            }
            finishLoading();
          }
        }, 2500);

        sessionPromise
          .then(({ data, error }) => {
            clearTimeout(sessionTimeoutId);
            handleSession(data, error);
          })
          .catch((error) => {
            clearTimeout(sessionTimeoutId);
            console.error("AuthContext init error:", error);
            if (mounted) {
              setSession(null);
              setProfile(null);
            }
            finishLoading();
          });
      } catch (error) {
        console.error("AuthContext init error:", error);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
        finishLoading();
      }
    };

    hardTimeoutId = setTimeout(() => {
      if (!finished && mounted) {
        console.warn("AuthContext: Timeout fallback - forcing loading to false");
        finishLoading();
      }
    }, 8000);

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      const resolvedSession = resolveSession(newSession, event);
      setSession(resolvedSession);

      const authUser = resolvedSession?.user;
      if (authUser) {
        await fetchProfile(authUser);
        if (event === "SIGNED_IN") {
          await updateLastLogin(authUser);
        }
      } else {
        setProfile(null);
      }

      finishLoading();
    });

    return () => {
      mounted = false;
      clearTimeout(sessionTimeoutId);
      clearTimeout(hardTimeoutId);
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
