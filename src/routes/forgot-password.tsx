import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
      <div className="glass-card rounded-2xl p-8">
        <h1 className="font-display text-2xl font-extrabold">Forgot your password?</h1>
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
            The link expires after a short while, so use it soon.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we'll send a secure reset link.
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
              <button disabled={loading} className={`${btnPrimary} w-full`}>
                Send reset link
              </button>
            </form>
          </>
        )}
        <Link
          to="/auth"
          className="mt-5 block text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
