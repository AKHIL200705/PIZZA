import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // A recovery link creates a temporary session; wait for it before allowing a change.
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
      toast.error("Password needs 8+ characters with letters and numbers");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
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
      <div className="glass-card rounded-2xl p-8">
        <h1 className="font-display text-2xl font-extrabold">Set a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Open this page from the reset link in your email. If the link has expired,
            request a new one.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="New password">
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                className={inputClass}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button disabled={loading} className={`${btnPrimary} w-full`}>
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
