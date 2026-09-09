import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { btnGhost, btnPrimary, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — PizzaHub" },
      {
        name: "description",
        content: "Update your delivery details and change your PizzaHub password.",
      },
      { property: "og:title", content: "Your profile — PizzaHub" },
      { property: "og:description", content: "Update delivery details and password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh, isAdmin } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "" });

  useEffect(() => {
    if (profile)
      setForm({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile saved");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next.length < 8) {
      toast.error("New password needs 8+ characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: passwords.next,
      // Lovable Cloud requires the current password for signed-in changes.
      ...({ current_password: passwords.current } as Record<string, string>),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setPasswords({ current: "", next: "" });
    toast.success("Password updated");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user?.email}
        {isAdmin && " · staff account"}
      </p>

      <form onSubmit={save} className="glass-card mt-8 space-y-4 rounded-2xl p-6">
        <h2 className="font-display text-xl font-bold">Delivery details</h2>
        <Field label="Full name">
          <input
            className={inputClass}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <textarea
            className={`${inputClass} min-h-24`}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <button disabled={saving} className={btnPrimary}>
          Save changes
        </button>
      </form>

      <form onSubmit={changePassword} className="glass-card mt-6 space-y-4 rounded-2xl p-6">
        <h2 className="font-display text-xl font-bold">Change password</h2>
        <Field label="Current password">
          <input
            className={inputClass}
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password">
          <input
            className={inputClass}
            type="password"
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
            autoComplete="new-password"
          />
        </Field>
        <button className={btnGhost}>Update password</button>
      </form>
    </div>
  );
}
