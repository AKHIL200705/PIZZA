import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLocalUser = () => {
    try {
      if (typeof window === "undefined") return false;
      const rawUser = localStorage.getItem("pizzahub_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const pseudoUser: any = {
          id: u.id || u._id,
          email: u.email,
          user_metadata: { full_name: u.name },
        };
        setUser(pseudoUser);
        setProfile({
          id: u.id || u._id,
          full_name: u.name || "Customer",
          email: u.email,
          phone: u.phone || "",
          address: u.address || "",
        });
        setIsAdmin(u.role === "admin");
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const loadDetails = async (userId: string | undefined) => {
    if (loadLocalUser()) {
      setLoading(false);
      return;
    }
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    try {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile((prof as Profile) ?? null);
      setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;

    // First load from localStorage if logged in via Node API
    if (loadLocalUser()) {
      setLoading(false);
    }

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        if (!active) return;
        setSession(next);
        setUser(next?.user ?? null);
        setTimeout(() => {
          void loadDetails(next?.user?.id);
        }, 0);
      });

      void supabase.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        if (!loadLocalUser()) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          await loadDetails(data.session?.user?.id);
        }
        setLoading(false);
      });

      return () => {
        active = false;
        sub.subscription?.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const refresh = async () => {
    if (loadLocalUser()) return;
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadDetails(data.session?.user?.id);
    } catch {
      // ignore
    }
  };

  const signOut = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pizzahub_user");
        localStorage.removeItem("pizzahub_token");
      }
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        loading,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
