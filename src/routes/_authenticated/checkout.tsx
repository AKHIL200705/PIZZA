import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/data";
import { DELIVERY_FEE, inr } from "@/lib/format";
import { btnGhost, btnPrimary, EmptyState, Field, inputClass } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — confirm and pay | PizzaHub" },
      {
        name: "description",
        content:
          "Confirm your delivery details, review your order summary and pay securely in test mode.",
      },
      { property: "og:title", content: "Checkout — confirm and pay | PizzaHub" },
      { property: "og:description", content: "Confirm details and pay for your pizza order." },
    ],
  }),
  component: Checkout,
});

/** Simulated test-mode payment sheet (no real money moves). */
function PaymentSheet({
  amount,
  onCancel,
  onPaid,
}: {
  amount: number;
  onCancel: () => void;
  onPaid: (paymentId: string) => void;
}) {
  const [processing, setProcessing] = useState(false);

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      onPaid(`pay_test_${Math.random().toString(36).slice(2, 12)}`);
    }, 1400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Test payment"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
    >
      <div className="glass-card w-full max-w-sm space-y-4 rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="font-display text-xl font-bold">Test payment</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sandbox checkout — no real card is charged. Confirm to simulate a successful
          payment of <strong>{inr(amount)}</strong>.
        </p>
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          Test card 4111 1111 1111 1111 · any future expiry · CVV 123
        </div>
        <button onClick={pay} disabled={processing} className={`${btnPrimary} w-full`}>
          {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {processing ? "Processing…" : `Pay ${inr(amount)}`}
        </button>
        <button onClick={onCancel} disabled={processing} className={`${btnGhost} w-full`}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Checkout() {
  const { user, profile } = useAuth();
  const { data: cart } = useCart(user?.id);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [showPayment, setShowPayment] = useState(false);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (profile)
      setForm((f) => ({
        name: f.name || profile.full_name,
        phone: f.phone || profile.phone,
        address: f.address || profile.address,
      }));
  }, [profile]);

  const items = cart ?? [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const startPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Enter your name");
      return;
    }
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      toast.error("Enter a 10-digit phone number");
      return;
    }
    if (form.address.trim().length < 10) {
      toast.error("Enter a full delivery address");
      return;
    }
    setShowPayment(true);
  };

  const placeOrder = async (paymentId: string) => {
    setPlacing(true);
    // Save details back onto the profile for next time.
    if (user)
      await supabase
        .from("profiles")
        .update({ full_name: form.name, phone: form.phone, address: form.address })
        .eq("id", user.id);

    const { data, error } = await supabase.rpc("place_order", {
      p_customer_name: form.name,
      p_phone: form.phone,
      p_address: form.address,
      p_payment_id: paymentId,
    });
    setPlacing(false);
    setShowPayment(false);

    if (error) {
      if (error.message.includes("OUT_OF_STOCK")) {
        toast.error(
          `Out of stock: ${error.message.split("OUT_OF_STOCK:")[1]?.trim()} — please adjust your order.`,
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["ingredients"] });
    toast.success("Payment successful — your pizza is on its way!");
    navigate({ to: "/orders/$id", params: { id: data as string } });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty — add a pizza first."
          action={
            <Link to="/menu" className={btnPrimary}>
              Browse the menu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={startPayment} className="glass-card space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold">Delivery details</h2>
          <Field label="Full name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
          </Field>
          <Field label="Phone number">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
            />
          </Field>
          <Field label="Delivery address">
            <textarea
              className={`${inputClass} min-h-28`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Flat, street, area, city, PIN"
              autoComplete="street-address"
            />
          </Field>
          <button className={`${btnPrimary} w-full`} disabled={placing}>
            <ShieldCheck className="h-4 w-4" aria-hidden /> Pay {inr(total)} (test mode)
          </button>
        </form>

        <aside className="glass-card h-fit space-y-3 rounded-2xl p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.quantity} × {i.name}
                </span>
                <span>{inr(Number(i.unit_price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{inr(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{inr(DELIVERY_FEE)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{inr(total)}</span>
          </div>
        </aside>
      </div>

      {showPayment && (
        <PaymentSheet
          amount={total}
          onCancel={() => setShowPayment(false)}
          onPaid={placeOrder}
        />
      )}
    </div>
  );
}
