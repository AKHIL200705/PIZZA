import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Check local session from Express/MongoDB
    if (typeof window !== "undefined") {
      const localUser = localStorage.getItem("pizzahub_user");
      if (localUser) {
        try {
          const u = JSON.parse(localUser);
          return { user: { id: u.id || u._id, email: u.email } };
        } catch {
          // ignore
        }
      }
    }

    // 2. Check Supabase session
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        return { user: data.user };
      }
    } catch {
      // ignore
    }

    // If not authenticated, redirect to /auth
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
