import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Printer,
  Bike,
  Clock,
  Flame,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrder } from "@/lib/data";
import { formatDate, inr } from "@/lib/format";
import { pizzaImage } from "@/lib/images";
import { StatusTracker } from "@/components/site/StatusTracker";
import { btnGhost, btnPrimary, EmptyState, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "Track Your Pizza Live — PizzaHub" },
      {
        name: "description",
        content:
          "Watch your stone-fired pizza progress from kitchen to your door with live status updates.",
      },
      { property: "og:title", content: "Track Your Pizza Live — PizzaHub" },
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
    // Polling interval to auto-update order status
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["order", id] });
    }, 8000);

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["order", id] });
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus) {
            const formattedStatus = newStatus.replace("_", " ").toUpperCase();
            toast.info(`🔔 Order Status Updated: ${formattedStatus}`);
          }
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [id, qc]);

  if (isLoading) return <Skeleton className="mx-4 my-14 h-96 max-w-5xl md:mx-auto rounded-3xl" />;

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
  const statusLower = order.status?.toLowerCase() || "received";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 print:py-4 print:px-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Live Kitchen & Courier Stream</span>
          </div>

          <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl text-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed {formatDate(order.created_at)} · Payment Reference:{" "}
            <span className="font-mono text-foreground font-semibold">{order.payment_id || "Verified"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className={`${btnGhost} flex items-center gap-2 px-4 py-2.5 text-xs font-bold`}
          >
            <Printer className="h-4 w-4" aria-hidden />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Live Estimated Arrival Hero Banner */}
      <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-primary/40 bg-gradient-to-r from-card via-card to-primary/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary animate-pulse-soft" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {statusLower.includes("delivered")
                  ? "Delivered Successfully"
                  : statusLower.includes("delivery")
                    ? "Out for Express Delivery"
                    : "Estimated Delivery Window"}
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
              {statusLower.includes("delivered")
                ? "Enjoy Your Hot Pizza! 🍕"
                : statusLower.includes("delivery")
                  ? "Arriving in ~8 - 12 mins 🛵"
                  : "Arriving in ~20 - 25 mins"}
            </h2>

            <p className="text-xs text-muted-foreground max-w-lg">
              {statusLower.includes("delivered")
                ? "Your order has been handed over fresh and hot. Thank you for choosing PizzaHub!"
                : "Your pizza is stone-baked at 480°C and transported in temperature-controlled thermal pods."}
            </p>
          </div>

          {/* Live Metrics Pills */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground backdrop-blur-xs">
              <Flame className="h-4 w-4 text-primary" />
              <span>Thermal Pod: 65°C Hot</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Razorpay Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Status Tracker Steps */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xl">
        <h3 className="font-display text-xl font-bold mb-6 text-foreground">Order Progress</h3>
        <StatusTracker status={order.status} />
      </div>

      {/* 2-Column Info: Items & Delivery Details */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Order Items */}
        <div className="glass-card space-y-4 rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xl lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h3 className="font-display text-xl font-bold text-foreground">Items in Order</h3>
            <span className="text-xs font-semibold text-muted-foreground">{items.length} item(s)</span>
          </div>

          <ul className="space-y-4 divide-y divide-border/40">
            {items.map((item) => {
              const details = (item.details || {}) as { veggies?: string[]; base?: string; sauce?: string; cheese?: string };
              return (
                <li key={item.id} className="pt-4 first:pt-0 flex gap-4 items-start">
                  <img
                    src={pizzaImage(item.image_key)}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-16 w-16 rounded-2xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-bold text-foreground truncate">
                      {item.quantity} × {item.name}
                    </p>
                    {details.base && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">{details.base}</strong>
                        {details.sauce && ` · ${details.sauce}`}
                        {details.cheese && ` · ${details.cheese}`}
                        {details.veggies?.length ? ` · ${details.veggies.join(", ")}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="font-display text-lg font-bold text-foreground shrink-0">
                    {inr(Number(item.unit_price) * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column: Courier & Delivery Details */}
        <div className="space-y-6 lg:col-span-5">
          {/* Courier Card */}
          <div className="glass-card rounded-3xl p-6 border border-border/80 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              <span>Delivery Courier</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center font-display font-bold text-lg text-primary border border-primary/30">
                RK
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Rahul Kumar</p>
                <p className="text-xs text-muted-foreground">PizzaHub Fleet · Ather EV Scooter</p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => toast.info("Calling courier Rahul Kumar (+91 98765 43210)...")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/80 hover:bg-secondary py-2 text-xs font-bold text-foreground transition-all"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Call Courier</span>
              </button>
            </div>
          </div>

          {/* Delivery Address & Summary */}
          <div className="glass-card rounded-3xl p-6 border border-border/80 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Delivery Address</span>
            </h3>

            <div className="text-xs space-y-1 text-muted-foreground bg-secondary/40 p-3.5 rounded-2xl border border-border/60">
              <p className="font-bold text-foreground text-sm">{order.customer_name}</p>
              <p>{order.phone}</p>
              <p className="leading-relaxed">{order.address}</p>
            </div>

            <div className="space-y-2 border-t border-border/70 pt-4 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="text-foreground font-semibold">{inr(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Express Delivery Fee</span>
                <span className="text-foreground font-semibold">{inr(Number(order.delivery_fee))}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold border-t border-border/60 pt-3">
                <span className="text-foreground">Total Paid</span>
                <span className="font-display text-xl text-primary">{inr(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
