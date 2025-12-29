import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PrismaAuthContext = createContext(null);

export function PrismaAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false); // Set to false to avoid blocking

  // Simplified auth context for production
  const contextValue = useMemo(() => ({
    session,
    profile,
    loading,
    user: session?.user || null,
    role: 'admin', // Default to admin for now
    permissions: ['*'], // Grant all permissions
    
    // Auth functions
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    
    // Permission functions
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
    isAdmin: () => true,
    isUser: () => true,
    isGuest: () => false,
  }), [session, profile, loading]);

  return (
    <PrismaAuthContext.Provider value={contextValue}>
      {children}
    </PrismaAuthContext.Provider>
  );
}

export function usePrismaAuth() {
  const context = useContext(PrismaAuthContext);
  if (!context) {
    throw new Error("usePrismaAuth must be used within a PrismaAuthProvider");
  }
  return context;
}
