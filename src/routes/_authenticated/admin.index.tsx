import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, IndianRupee, Package, ShoppingBag, Timer } from "lucide-react";
import { useAllOrders, useIngredients } from "@/lib/data";
import { formatDate, inr } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { AdminShell } from "@/components/site/AdminShell";
import { Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — PizzaHub kitchen console" },
      {
        name: "description",
        content:
          "Revenue, order volume, pending tickets and low-stock alerts for the PizzaHub kitchen.",
      },
      { property: "og:title", content: "Admin dashboard — PizzaHub kitchen console" },
      { property: "og:description", content: "Revenue, orders and stock at a glance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  tone = "",
}: {
  icon: typeof Package;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-display mt-3 text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const { data: orders, isLoading } = useAllOrders(isAdmin);
  const { data: ingredients } = useIngredients();

  const all = orders ?? [];
  const pending = all.filter((o) => ["Order Received", "In Kitchen"].includes(o.status));
  const completed = all.filter((o) => o.status === "Delivered");
  const revenue = all
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const lowStock = (ingredients ?? []).filter((i) => i.stock_qty < i.low_stock_threshold);

  return (
    <AdminShell title="Dashboard">
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={ShoppingBag} label="Total orders" value={String(all.length)} />
            <Stat icon={Timer} label="Pending" value={String(pending.length)} />
            <Stat icon={Package} label="Completed" value={String(completed.length)} />
            <Stat icon={IndianRupee} label="Revenue" value={inr(revenue)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-display flex items-center gap-2 text-xl font-bold">
                <AlertTriangle className="h-5 w-5 text-warning" aria-hidden /> Low stock alerts
              </h2>
              {lowStock.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Every ingredient is above its threshold.
                </p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {lowStock.map((i) => (
                    <li
                      key={i.id}
                      className="flex justify-between rounded-xl bg-warning/10 px-3 py-2"
                    >
                      <span>
                        {i.name} <span className="text-muted-foreground">({i.category})</span>
                      </span>
                      <span className="font-semibold text-warning">
                        {i.stock_qty} left · threshold {i.low_stock_threshold}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass-card rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold">Latest orders</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {all.slice(0, 6).map((o) => (
                  <li key={o.id} className="flex justify-between gap-3 border-b border-border pb-2">
                    <span>#{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-muted-foreground">{formatDate(o.created_at)}</span>
                    <span className="font-semibold">{inr(Number(o.total))}</span>
                  </li>
                ))}
                {all.length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </AdminShell>
  );
}
