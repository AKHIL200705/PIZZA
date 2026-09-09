import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your PizzaHub account" },
      {
        name: "description",
        content:
          "Log in to track your pizza orders, or register in seconds to start building your perfect pizza.",
      },
      { property: "og:title", content: "Sign in or create your PizzaHub account" },
      {
        property: "og:description",
        content: "Log in to track orders or register to start building your pizza.",
      },
    ],
  }),
  component: AuthPage,
});

type Errors = Record<string, string>;

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/menu", replace: true });
  }, [user, navigate]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Errors = {};
    if (mode === "register" && form.name.trim().length < 2) e['name'] = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e['email'] = "Enter a valid email";
    if (form.password.length < 8) e['password'] = "At least 8 characters";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      e['password'] = "Use both letters and numbers";
    if (mode === "register" && form.password !== form.confirm)
      e['confirm'] = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Account created — check your email to verify it");
        } else {
          toast.success("Welcome to PizzaHub!");
          navigate({ to: "/menu" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/menu" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(
        message.includes("Invalid login") ? "Wrong email or password" : message,
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="glass-card rounded-2xl p-10">
          <h1 className="font-display text-3xl font-extrabold">Verify your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to
            activate your account, then come back and sign in.
          </p>
          <button onClick={() => setSent(false)} className={`${btnPrimary} mt-6 w-full`}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="glass-card rounded-2xl p-8">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary/60 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === m ? "ember-gradient text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <h1 className="font-display text-2xl font-extrabold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to order and track your pizzas."
            : "It takes less than a minute."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {mode === "register" && (
            <Field label="Full name" error={errors['name']}>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Akhil Sharma"
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email" error={errors['email']}>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" error={errors['password']}>
            <input
              className={inputClass}
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
          {mode === "register" && (
            <Field label="Confirm password" error={errors['confirm']}>
              <input
                className={inputClass}
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 flex justify-between text-sm text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          <Link to="/admin-login" className="hover:text-foreground">
            Staff login
          </Link>
        </div>
      </div>
    </div>
  );
}
