import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { btnPrimary, Field, inputClass } from "@/components/site/ui";

declare global {
  interface Window {
    google?: any;
  }
}

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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/menu", replace: true });
  }, [user, navigate]);

  // Load Google Identity Services script if Google Client ID is configured
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              loginWithGooglePayload({ credential: response.credential });
            }
          },
        });
        const container = document.getElementById("google-official-btn");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: mode === "login" ? "signin_with" : "signup_with",
            shape: "rectangular",
          });
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        // ignore
      }
    };
  }, [mode]);

  const handleGoogleSuccess = (data: { token: string; user: any }) => {
    localStorage.setItem("pizzahub_token", data.token);
    localStorage.setItem("pizzahub_user", JSON.stringify(data.user));
    toast.success(`Welcome, ${data.user.name || "Customer"}!`);
    window.location.href = "/menu";
  };

  const loginWithGooglePayload = async (payload: { credential?: string; email?: string; name?: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google sign-in failed");
      handleGoogleSuccess(data);
    } catch (err: any) {
      // Fallback to Supabase OAuth if available
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin + "/menu" },
        });
        if (error) throw error;
      } catch {
        toast.error(err.message || "Could not sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleEmail(form.email || "");
          setGoogleName(form.name || "");
          setShowGoogleModal(true);
        }
      });
      return;
    }
    // If no client ID configured or prompt skipped, show quick Google login modal
    setGoogleEmail(form.email || "");
    setGoogleName(form.name || "");
    setShowGoogleModal(true);
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Errors = {};
    if (mode === "register" && form.name.trim().length < 2) e["name"] = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e["email"] = "Enter a valid email";
    if (form.password.length < 8) e["password"] = "At least 8 characters";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      e["password"] = "Use both letters and numbers";
    if (mode === "register" && form.password !== form.confirm)
      e["confirm"] = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "register") {
        try {
          const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");
          setSent(true);
          toast.success("Account created successfully! Check email for verification link.");
          return;
        } catch (apiErr: any) {
          // Fallback to Supabase if Express server not running
          if (!apiErr.message?.includes("Failed to fetch")) {
            throw apiErr;
          }
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
        }
      } else {
        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.email,
              password: form.password,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Invalid credentials");
          localStorage.setItem("pizzahub_token", data.token);
          localStorage.setItem("pizzahub_user", JSON.stringify(data.user));
          toast.success("Signed in successfully!");
          window.location.href = "/menu";
          return;
        } catch (apiErr: any) {
          if (!apiErr.message?.includes("Failed to fetch")) {
            throw apiErr;
          }
          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (error) throw error;
          toast.success("Signed in");
          navigate({ to: "/menu" });
        }
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
      <div className="glass-card rounded-2xl p-8 shadow-xl">
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
            <Field label="Full name" error={errors["name"]}>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Akhil Sharma"
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email" error={errors["email"]}>
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" error={errors["password"]}>
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
            <Field label="Confirm password" error={errors["confirm"]}>
              <input
                className={inputClass}
                type="password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full shadow-md`}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
          </div>
        </div>

        {/* Official Google button mount if GSI is active */}
        <div id="google-official-btn" className="flex justify-center empty:hidden mb-2"></div>

        {/* Branded Sign in with Google button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/70 px-4 py-2.5 text-sm font-semibold text-foreground transition-all shadow-xs active:scale-[0.99]"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          <span>{mode === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
        </button>

        <div className="mt-5 flex justify-between text-sm text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          <Link to="/admin-login" className="hover:text-foreground">
            Staff login
          </Link>
        </div>
      </div>

      {/* Google Sign In Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="glass-card relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-xs border border-border">
                <GoogleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Sign in with Google</h3>
                <p className="text-xs text-muted-foreground">Quick & secure account access</p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Google Email</label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className={`${inputClass} mt-1`}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Name (optional)</label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Akhil Sharma"
                  className={`${inputClass} mt-1`}
                />
              </div>

              <button
                type="button"
                disabled={loading || !googleEmail.includes("@")}
                onClick={() => {
                  setShowGoogleModal(false);
                  loginWithGooglePayload({
                    email: googleEmail.trim(),
                    name: googleName.trim() || undefined,
                  });
                }}
                className={`${btnPrimary} w-full mt-2`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  loginWithGooglePayload({
                    email: "google.user@gmail.com",
                    name: "Google Pizza Fan",
                  });
                }}
                className="w-full rounded-xl border border-border/80 bg-secondary/50 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                ⚡ Quick 1-Click Demo Google Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
