import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAllOrders, useUpdateOrderStatus, type Order, type OrderItem } from "@/lib/data";
import { formatDate, inr } from "@/lib/format";
import { AdminShell } from "@/components/site/AdminShell";
import { btnGhost, inputClass, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "Order management — PizzaHub kitchen console" },
      {
        name: "description",
        content: "Search, filter and progress every PizzaHub order from received to delivered.",
      },
      { property: "og:title", content: "Order management — PizzaHub" },
      { property: "og:description", content: "Search, filter and progress every order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

const STATUSES = ["Order Received", "In Kitchen", "Sent to Delivery", "Delivered", "Cancelled"];

function OrderDetails({ order }: { order: Order }) {
  const [items, setItems] = useState<OrderItem[] | null>(
    order.items && order.items.length > 0 ? order.items : null,
  );

  useEffect(() => {
    if (order.items && order.items.length > 0) {
      setItems(order.items);
      return;
    }

    void supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .then(({ data }) => {
        if (data && data.length > 0) setItems(data as OrderItem[]);
      });
  }, [order.id, order.items]);

  const displayItems = items || order.items || [];

  return (
    <div className="rounded-xl bg-secondary/40 border border-border/80 p-4 text-sm space-y-3">
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground uppercase tracking-wider font-semibold block">
            Customer Details
          </span>
          <p className="font-semibold text-foreground text-sm mt-0.5">{order.customer_name}</p>
          <p className="text-muted-foreground">{order.phone}</p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wider font-semibold block">
            Delivery Destination
          </span>
          <p className="text-foreground text-xs mt-0.5 leading-relaxed">{order.address}</p>
        </div>
      </div>

      <div className="border-t border-border/60 pt-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Payment Reference:{" "}
          <strong className="font-mono text-foreground">{order.payment_id}</strong>
        </span>
        <span className="capitalize font-semibold text-emerald-500">
          Status: {order.payment_status || "Paid"}
        </span>
      </div>

      <div className="border-t border-border/60 pt-2.5">
        <span className="text-muted-foreground uppercase tracking-wider font-semibold block text-xs mb-2">
          Ordered Items & Custom Ingredients
        </span>
        <ul className="space-y-1.5 text-xs">
          {displayItems.map((item) => {
            const d = (item.details || {}) as {
              base?: string;
              sauce?: string;
              cheese?: string;
              veggies?: string[];
            };
            return (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-background/60 p-2 border border-border/40"
              >
                <div>
                  <span className="font-bold text-foreground">
                    {item.quantity} × {item.name}
                  </span>
                  {(d.base || d.sauce || d.cheese || (d.veggies && d.veggies.length > 0)) && (
                    <span className="text-muted-foreground block text-[11px] mt-0.5">
                      Base: <strong className="text-foreground/90">{d.base || "Standard"}</strong> ·
                      Sauce: <strong className="text-foreground/90">{d.sauce || "Standard"}</strong>
                      {d.cheese ? ` · Cheese: ${d.cheese}` : ""}
                      {d.veggies?.length ? ` · Veggies: ${d.veggies.join(", ")}` : ""}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-foreground shrink-0">
                  {inr(Number(item.unit_price) * (item.quantity || 1))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AdminOrders() {
  const { isAdmin } = useAuth();
  const { data: orders, isLoading } = useAllOrders(isAdmin);
  const updateStatus = useUpdateOrderStatus();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-orders"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  const filtered = (orders ?? []).filter((o) => {
    const matchesStatus = status === "all" || o.status === status;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminShell title="Orders">
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className={`${inputClass} sm:max-w-xs`}
          placeholder="Search by order id, name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search orders"
        />
        <select
          className={`${inputClass} sm:max-w-48`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : filtered.length === 0 ? (
        <p className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No orders match your filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => (
            <li key={order.id} className="glass-card space-y-4 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer_name} · {formatDate(order.created_at)}
                  </p>
                </div>
                <span className="font-display text-xl font-bold">{inr(Number(order.total))}</span>
                <select
                  className={`${inputClass} w-48 py-2`}
                  value={order.status}
                  onChange={(e) =>
                    updateStatus.mutate(
                      { id: order.id, status: e.target.value },
                      {
                        onSuccess: () => toast.success("Status updated"),
                        onError: (err) => toast.error(err.message),
                      },
                    )
                  }
                  aria-label={`Status for order ${order.id.slice(0, 8)}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className={`${btnGhost} px-4 py-2`}
                  onClick={() => setOpenId(openId === order.id ? null : order.id)}
                >
                  {openId === order.id ? "Hide" : "Details"}
                </button>
              </div>
              {openId === order.id && <OrderDetails order={order} />}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
