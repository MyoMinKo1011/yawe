"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";

interface SupabaseContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  displayName: null,
  avatarUrl: null,
  signOut: async () => {},
});

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(
    null
  );
  const router = useRouter();

  const signOut = async () => {
    if (!supabaseRef.current) return;
    await supabaseRef.current.auth.signOut();
    setUser(null);
    router.push("/auth/login");
  };

  useEffect(() => {
    try {
      supabaseRef.current = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    } catch {
      setLoading(false);
      return;
    }

    const supabase = supabaseRef.current;

    const {
      data: { subscription },
    } =     supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_admin, display_name, avatar_url")
          .eq("id", session.user.id)
          .single()
          .then((result: { data: unknown }) => {
            const p = result.data as Record<string, unknown> | null;
            setIsAdmin((p?.is_admin as boolean) ?? false);
            setDisplayName((p?.display_name as string) ?? null);
            setAvatarUrl((p?.avatar_url as string) ?? null);
          });
      } else {
        setIsAdmin(false);
        setDisplayName(null);
        setAvatarUrl(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("is_admin, display_name, avatar_url")
          .eq("id", session.user.id)
          .single();
        setIsAdmin((data as Record<string, unknown> | null)?.is_admin as boolean ?? false);
        setDisplayName((data as Record<string, unknown> | null)?.display_name as string ?? null);
        setAvatarUrl((data as Record<string, unknown> | null)?.avatar_url as string ?? null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, loading, isAdmin, displayName, avatarUrl, signOut }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
