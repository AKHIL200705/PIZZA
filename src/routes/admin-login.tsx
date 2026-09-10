import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { btnGhost, btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Staff Login — PizzaHub Kitchen Console" },
      {
        name: "description",
        content:
          "Restricted staff sign-in for the PizzaHub kitchen console: orders, inventory and delivery status.",
      },
      { property: "og:title", content: "Staff Login — PizzaHub Kitchen Console" },
      { property: "og:description", content: "Restricted staff sign-in for PizzaHub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { user, isAdmin, refresh } = useAuth();

  const handleFillDemo = () => {
    setEmail("admin@pizzahub.com");
    setPassword("Admin@123456");
    setErrorMsg("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both admin email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid staff credentials");
      }

      localStorage.setItem("pizzahub_token", data.token);
      localStorage.setItem("pizzahub_user", JSON.stringify(data.user));
      setLoading(false);
      toast.success("Welcome back, Kitchen Manager!");
      window.location.href = "/admin";
      return;
    } catch (apiErr: any) {
      if (!apiErr.message?.includes("Failed to fetch")) {
        setLoading(false);
        setErrorMsg(apiErr.message || "Invalid credentials");
        toast.error(apiErr.message || "Invalid credentials");
        return;
      }

      // Supabase fallback if local Express API is not running
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setErrorMsg("Invalid credentials or server unavailable");
        toast.error("Wrong email or password");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setLoading(false);
      if (!roles?.some((r) => r.role === "admin")) {
        setErrorMsg("This account does not have staff permissions");
        toast.error("This account does not have staff access");
        await refresh();
        return;
      }
      await refresh();
      toast.success("Welcome back, Kitchen Manager!");
      navigate({ to: "/admin" });
    }
  };

  const claimAdmin = async () => {
    const { data, error } = await supabase.rpc("claim_admin");
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    if (data) {
      toast.success("Staff access granted");
      navigate({ to: "/admin" });
    } else {
      toast.error("An admin already exists — ask them to grant you access");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass-card rounded-2xl p-8 border border-border/80 shadow-2xl">
        <span className="ember-gradient mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Staff Console Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted kitchen portal. Customer accounts are not permitted and cannot access admin features.
        </p>

        {/* Demo Credentials Quick Fill Banner */}
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <KeyRound className="h-3.5 w-3.5" /> Demo Staff Credentials:
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="font-bold text-primary underline hover:opacity-80 transition-opacity"
            >
              Fill Credentials
            </button>
          </div>
          <p className="mt-1 font-mono text-muted-foreground">
            admin@pizzahub.com · Admin@123456
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Staff email">
            <input
              className={inputClass}
              type="email"
              required
              placeholder="admin@pizzahub.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
            />
          </Field>
          <button
            disabled={loading}
            className={`${btnPrimary} w-full flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authenticating Staff...
              </>
            ) : (
              "Enter Kitchen Console"
            )}
          </button>
        </form>

        {user && !isAdmin && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-sm text-muted-foreground">
              First-time setup: if no staff account exists yet, claim staff access for the account
              you are signed in with.
            </p>
            <button onClick={claimAdmin} className={`${btnGhost} mt-3 w-full`}>
              Claim first staff account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
