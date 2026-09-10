import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your PizzaHub password" },
      {
        name: "description",
        content: "Send yourself a secure password reset link for your PizzaHub account.",
      },
      { property: "og:title", content: "Reset your PizzaHub password" },
      {
        property: "og:description",
        content: "Send yourself a secure password reset link.",
      },
    ],
  }),
  component: ForgotPassword,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setLoading(false);
        setSent(true);
        toast.success("Password reset link sent to your email!");
        return;
      }
    } catch {
      // Fallback to Supabase if local Express API not reached
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass-card rounded-2xl p-8 border border-border/80 shadow-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Forgot your password?
        </h1>
        {sent ? (
          <div className="mt-4 space-y-4">
            <span className="ember-gradient mx-auto flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
              <MailCheck className="h-6 w-6 text-primary-foreground" aria-hidden />
            </span>
            <p className="text-sm text-muted-foreground text-center">
              If an account exists for <strong>{email}</strong>, a reset link has been dispatched to
              your email. The link expires after 1 hour for security.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered account email and we'll send a secure one-time reset link.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Email">
                <input
                  className={inputClass}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <button
                disabled={loading}
                className={`${btnPrimary} w-full flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <Link
          to="/auth"
          className="mt-6 block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
