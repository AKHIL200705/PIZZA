import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/lib/data";
import { DELIVERY_FEE, inr } from "@/lib/format";
import { pizzaImage } from "@/lib/images";
import { btnPrimary, EmptyState, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — PizzaHub" },
      {
        name: "description",
        content: "Review your pizzas, adjust quantities and see your delivery total.",
      },
      { property: "og:title", content: "Your cart — PizzaHub" },
      { property: "og:description", content: "Review your pizzas and delivery total." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { data: cart, isLoading } = useCart(user?.id);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const items = cart ?? [];
  const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Your cart</h1>

      {isLoading && <Skeleton className="mt-8 h-64" />}

      {!isLoading && items.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Add a signature pizza from the menu or design your own in the builder."
            action={
              <Link to="/menu" className={btnPrimary}>
                Browse the menu
              </Link>
            }
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-4">
            {items.map((item) => {
              const details = item.details as {
                base?: string;
                sauce?: string;
                cheese?: string;
                veggies?: string[];
              };
              return (
                <li key={item.id} className="glass-card flex gap-4 rounded-2xl p-4">
                  <img
                    src={pizzaImage(item.image_key)}
                    alt={item.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      {details.base && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {details.base} · {details.sauce} · {details.cheese}
                          {details.veggies?.length ? ` · ${details.veggies.join(", ")}` : ""}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {inr(Number(item.unit_price))} each
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() =>
                            item.quantity > 1
                              ? updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })
                              : removeItem.mutate(item.id)
                          }
                          className="rounded-lg border border-border p-2 hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })
                          }
                          className="rounded-lg border border-border p-2 hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">
                          {inr(Number(item.unit_price) * item.quantity)}
                        </span>
                        <button
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem.mutate(item.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="glass-card h-fit space-y-3 rounded-2xl p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>{inr(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{inr(subtotal + DELIVERY_FEE)}</span>
            </div>
            <Link to="/checkout" className={`${btnPrimary} w-full`}>
              Continue to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
