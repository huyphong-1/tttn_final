import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, getCachedSession } from "../lib/supabase";
import { profilesApi } from "../lib/apiClient";
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

const PrismaAuthContext = createContext(null);
let hasWarnedSessionSlow = false;

export function PrismaAuthProvider({ children }) {
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
      // Use API endpoint instead of direct Supabase
      const { data } = await profilesApi.getProfile(userId);
      
      if (data) {
        // Keep admin role in sync
        const isAdminAccount = isAdminEmail(authUser.email);
        if (isAdminAccount && data.role !== ROLES.ADMIN) {
          const updated = await profilesApi.updateProfile(userId, { role: ROLES.ADMIN });
          setProfile(updated.data);
        } else if (!isAdminAccount && data.role === ROLES.ADMIN) {
          const updated = await profilesApi.updateProfile(userId, { role: ROLES.USER });
          setProfile(updated.data);
        } else {
          setProfile(data);
        }
      } else {
        // Create profile if not exists
        const isAdmin = isAdminEmail(authUser.email);
        const defaultProfile = {
          id: userId,
          email: authUser.email || "",
          full_name: authUser.user_metadata?.full_name || "",
          role: isAdmin ? ROLES.ADMIN : ROLES.USER,
          status: "active",
        };

        const created = await profilesApi.createProfile(defaultProfile);
        setProfile(created.data);
      }
    } catch (error) {
      console.error("fetchProfile API error:", error);
      
      // Fallback to default profile if API fails
      const isAdmin = isAdminEmail(authUser.email);
      const defaultProfile = {
        id: userId,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "",
        role: isAdmin ? ROLES.ADMIN : ROLES.USER,
        status: "active",
      };
      setProfile(defaultProfile);
    }
  };

  const updateLastLogin = async (authUser) => {
    if (!authUser?.id) return;
    
    try {
      await profilesApi.updateLastLogin(authUser.id);
      setProfile((prev) =>
        prev?.id === authUser.id 
          ? { ...prev, last_login: new Date().toISOString() } 
          : prev
      );
    } catch (error) {
      console.warn("updateLastLogin API error:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let finished = false;
    let sessionTimeoutId;

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

        // Try cached session first for instant load
        const cachedSession = getCachedSession?.();
        if (cachedSession?.user && mounted) {
          setSession(cachedSession);
          fetchProfile(cachedSession.user);
          finishLoading();
          return; // Skip getSession call if we have valid cache
        }

        // Reduced timeout for faster initial load
        const sessionPromise = supabase.auth.getSession();
        sessionTimeoutId = setTimeout(() => {
          if (!finished && mounted) {
            if (!hasWarnedSessionSlow && import.meta.env.DEV) {
              hasWarnedSessionSlow = true;
              console.warn("PrismaAuthContext: getSession is slow, continuing without blocking");
            }
            finishLoading();
          }
        }, 300); // Reduced from 500ms to 300ms

        sessionPromise
          .then(({ data, error }) => {
            clearTimeout(sessionTimeoutId);
            handleSession(data, error);
          })
          .catch((error) => {
            clearTimeout(sessionTimeoutId);
            console.error("PrismaAuthContext init error:", error);
            if (mounted) {
              setSession(null);
              setProfile(null);
            }
            finishLoading();
          });
      } catch (error) {
        console.error("PrismaAuthContext init error:", error);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
        finishLoading();
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("[PrismaAuthContext] Auth state changed:", event);
        setSession(session);
        
        if (event === "SIGNED_IN" && session?.user) {
          await fetchProfile(session.user);
          await updateLastLogin(session.user);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    };
  }, []);

  const contextValue = useMemo(() => {
    const user = session?.user ?? null;
    const isAuthenticated = !!session && !!user;

    return {
      session,
      profile,
      user,
      loading,
      isAuthenticated,
      role: profile?.role || null,
      
      // Permission helpers
      hasPermission: (permission) => hasPermission(profile?.role, permission),
      hasAnyPermission: (permissions) => hasAnyPermission(profile?.role, permissions),
      hasAllPermissions: (permissions) => hasAllPermissions(profile?.role, permissions),
      isAdmin: () => isAdmin(profile),
      isUser: () => isUser(profile),
      isGuest: () => isGuest(profile),
      
      // Auth actions
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { data, error };
      },
      signUp: async (email, password, options = {}) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options,
        });
        return { data, error };
      },
      signOut: () => supabase.auth.signOut(),
      updateLastLogin: () => updateLastLogin(user),
    };
  }, [session, profile, loading]);

  return (
    <PrismaAuthContext.Provider value={contextValue}>
      {children}
    </PrismaAuthContext.Provider>
  );
}

export function usePrismaAuth() {
  const context = useContext(PrismaAuthContext);
  if (context === undefined) {
    throw new Error("usePrismaAuth must be used within a PrismaAuthProvider");
  }
  return context;
}

export { PrismaAuthContext };
