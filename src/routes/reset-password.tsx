import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new PizzaHub password" },
      {
        name: "description",
        content: "Set a new password for your PizzaHub account using your recovery link.",
      },
      { property: "og:title", content: "Choose a new PizzaHub password" },
      { property: "og:description", content: "Set a new password using your recovery link." },
    ],
  }),
  component: ResetPassword,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("token")) {
        setReady(true);
        return;
      }
    }
    // Supabase recovery link session check
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password needs 8+ characters with both letters and numbers");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);

    // 1. Check token in URL for Express backend
    const token =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token")
        : null;
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) throw new Error(data.message || "Failed to reset password");
        toast.success("Password updated successfully! You can now sign in.");
        navigate({ to: "/auth" });
        return;
      } catch (err: any) {
        setLoading(false);
        toast.error(err.message || "Password reset failed");
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — you're signed in");
    navigate({ to: "/menu" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass-card rounded-2xl p-8 border border-border/80 shadow-2xl">
        <span className="ember-gradient mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
          <KeyRound className="h-6 w-6 text-primary-foreground" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Set a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Open this page from the reset link in your email. If the link has expired, please
            request a fresh reset link.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="New password">
              <input
                className={inputClass}
                type="password"
                value={password}
                placeholder="At least 8 characters"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                className={inputClass}
                type="password"
                value={confirm}
                placeholder="Re-enter password"
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button
              disabled={loading}
              className={`${btnPrimary} w-full flex items-center justify-center gap-2`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
