import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrder } from "@/lib/data";
import { formatDate, inr } from "@/lib/format";
import { pizzaImage } from "@/lib/images";
import { StatusTracker } from "@/components/site/StatusTracker";
import { btnPrimary, EmptyState, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "Track your order — PizzaHub" },
      {
        name: "description",
        content:
          "Follow your pizza from the kitchen to your door with live status updates.",
      },
      { property: "og:title", content: "Track your order — PizzaHub" },
      { property: "og:description", content: "Live tracking from kitchen to your door." },
    ],
  }),
  component: TrackOrder,
});

function TrackOrder() {
  const { id } = Route.useParams();
  const { data, isLoading } = useOrder(id);
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["order", id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, qc]);

  if (isLoading) return <Skeleton className="mx-4 my-14 h-96 max-w-4xl md:mx-auto" />;

  if (!data?.order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Order not found"
          description="This order does not exist or belongs to another account."
          action={
            <Link to="/orders" className={btnPrimary}>
              Back to my orders
            </Link>
          }
        />
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Order #{order.id.slice(0, 8).toUpperCase()}
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">
        Tracking your pizza
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed {formatDate(order.created_at)} · Payment {order.payment_id || "—"}
      </p>

      <div className="glass-card mt-8 rounded-2xl p-6">
        <StatusTracker status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold">Items</h2>
          <ul className="space-y-3">
            {items.map((item) => {
              const details = item.details as { veggies?: string[]; base?: string };
              return (
                <li key={item.id} className="flex gap-3">
                  <img
                    src={pizzaImage(item.image_key)}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {item.quantity} × {item.name}
                    </p>
                    {details.base && (
                      <p className="text-xs text-muted-foreground">
                        {details.base}
                        {details.veggies?.length ? ` · ${details.veggies.join(", ")}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold">
                    {inr(Number(item.unit_price) * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass-card space-y-2 rounded-2xl p-6 text-sm">
          <h2 className="font-display text-xl font-bold">Delivery</h2>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-muted-foreground">{order.phone}</p>
          <p className="text-muted-foreground">{order.address}</p>
          <div className="mt-4 space-y-1 border-t border-border pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{inr(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{inr(Number(order.delivery_fee))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total paid</span>
              <span>{inr(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
