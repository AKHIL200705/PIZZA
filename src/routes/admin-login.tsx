import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { btnGhost, btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Staff login — PizzaHub kitchen console" },
      {
        name: "description",
        content:
          "Restricted staff sign-in for the PizzaHub kitchen console: orders, inventory and delivery status.",
      },
      { property: "og:title", content: "Staff login — PizzaHub kitchen console" },
      { property: "og:description", content: "Restricted staff sign-in for PizzaHub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, refresh } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Wrong email or password");
      localStorage.setItem("pizzahub_token", data.token);
      localStorage.setItem("pizzahub_user", JSON.stringify(data.user));
      setLoading(false);
      toast.success("Welcome back, Kitchen Manager!");
      window.location.href = "/admin";
      return;
    } catch (apiErr: any) {
      if (!apiErr.message?.includes("Failed to fetch")) {
        setLoading(false);
        toast.error(apiErr.message || "Invalid credentials");
        return;
      }
      // Fallback if Express not running
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        toast.error("Wrong email or password");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setLoading(false);
      if (!roles?.some((r) => r.role === "admin")) {
        toast.error("This account does not have staff access");
        await refresh();
        return;
      }
      await refresh();
      toast.success("Welcome back, chef");
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
      <div className="glass-card rounded-2xl p-8">
        <span className="ember-gradient mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-extrabold">Staff console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate sign-in for kitchen and delivery staff. Customer accounts can never gain
          staff access by registering.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Staff email">
            <input
              className={inputClass}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button disabled={loading} className={`${btnPrimary} w-full`}>
            Enter console
          </button>
        </form>

        {user && !isAdmin && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-sm text-muted-foreground">
              First-time setup: if no staff account exists yet, claim staff access for the
              account you are signed in with.
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
