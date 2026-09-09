import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyOrders } from "@/lib/data";
import { formatDate, inr } from "@/lib/format";
import { btnPrimary, EmptyState, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "My orders — PizzaHub" },
      {
        name: "description",
        content: "See every PizzaHub order you have placed and track live delivery status.",
      },
      { property: "og:title", content: "My orders — PizzaHub" },
      { property: "og:description", content: "Track your PizzaHub orders live." },
    ],
  }),
  component: MyOrders,
});

const statusStyle: Record<string, string> = {
  "Order Received": "bg-secondary text-foreground",
  "In Kitchen": "bg-warning/20 text-warning",
  "Sent to Delivery": "bg-primary/20 text-primary",
  Delivered: "bg-success/20 text-success",
  Cancelled: "bg-destructive/20 text-destructive",
};

function MyOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useMyOrders(user?.id);
  const qc = useQueryClient();

  // Live status updates pushed by the kitchen.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["orders"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">My orders</h1>

      {isLoading && <Skeleton className="mt-8 h-40" />}

      {!isLoading && (orders ?? []).length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No orders yet"
            description="Once you place an order it will appear here with live tracking."
            action={
              <Link to="/menu" className={btnPrimary}>
                Order a pizza
              </Link>
            }
          />
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {orders?.map((order) => (
          <li key={order.id}>
            <Link
              to="/orders/$id"
              params={{ id: order.id }}
              className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[order.status] ?? "bg-secondary"}`}
              >
                {order.status}
              </span>
              <span className="font-display text-xl font-bold">{inr(Number(order.total))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
