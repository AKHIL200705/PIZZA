import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAddToCart, usePizzas, type Pizza } from "@/lib/data";
import { inr } from "@/lib/format";
import { pizzaImage } from "@/lib/images";
import { btnGhost, btnPrimary, Skeleton, SectionTitle } from "@/components/site/ui";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Pizza Menu — Signature Wood-Fired Pizzas | PizzaHub" },
      {
        name: "description",
        content:
          "Browse PizzaHub's signature pizzas with fresh ingredients, live availability and instant ordering, or build your own from scratch.",
      },
      { property: "og:title", content: "Pizza Menu — Signature Wood-Fired Pizzas | PizzaHub" },
      {
        property: "og:description",
        content: "Signature pizzas, live stock and instant ordering at PizzaHub.",
      },
    ],
  }),
  component: MenuPage,
});

export function PizzaCard({ pizza }: { pizza: Pizza }) {
  const { user } = useAuth();
  const addToCart = useAddToCart(user?.id);

  const add = () => {
    if (!user) {
      toast.error("Please sign in to add pizzas to your cart");
      return;
    }
    addToCart.mutate(
      {
        name: pizza.name,
        image_key: pizza.image_key,
        unit_price: Number(pizza.price),
        quantity: 1,
        ingredient_ids: pizza.ingredient_ids,
        details: { type: "signature" },
      },
      {
        onSuccess: () => toast.success(`${pizza.name} added to cart`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <article className="glass-card group overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={pizzaImage(pizza.image_key)}
          alt={pizza.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!pizza.is_available && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm font-bold uppercase tracking-wide">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-xl font-bold">{pizza.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{pizza.description}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-lg font-bold">{inr(Number(pizza.price))}</span>
          <button
            onClick={add}
            disabled={!pizza.is_available || addToCart.isPending}
            className={`${btnPrimary} px-4 py-2`}
          >
            <Plus className="h-4 w-4" aria-hidden /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuPage() {
  const { data: pizzas, isLoading, error } = usePizzas();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <SectionTitle eyebrow="Our menu" title="Signature pizzas, fired fresh" />

      {error && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          Could not load the menu. Please refresh the page.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        {pizzas?.map((pizza) => <PizzaCard key={pizza.id} pizza={pizza} />)}
      </div>

      <div className="glass-card mt-12 flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <h3 className="font-display text-2xl font-bold">Nothing here? Build your own.</h3>
        <p className="max-w-lg text-sm text-muted-foreground">
          Pick your base, sauce, cheese and as many toppings as you like — we price it live
          as you go.
        </p>
        <Link to="/builder" className={btnGhost}>
          Open the pizza builder
        </Link>
      </div>
    </div>
  );
}
