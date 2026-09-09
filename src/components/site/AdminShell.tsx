import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { btnPrimary, EmptyState, Skeleton } from "@/components/site/ui";

const tabs = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/users", label: "Customers" },
] as const;

/** Shared chrome + staff-only gate for every admin screen. */
export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <Skeleton className="mx-4 my-14 h-96 max-w-6xl md:mx-auto" />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Staff access only"
          description="This console is restricted to kitchen staff. Sign in with a staff account to continue."
          action={
            <Link to="/admin-login" className={btnPrimary}>
              Go to staff login
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Kitchen console
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>

      <nav className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            activeOptions={{ exact: tab.to === "/admin" }}
            activeProps={{ className: "ember-gradient text-primary-foreground" }}
            inactiveProps={{ className: "bg-secondary/60 text-muted-foreground" }}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
