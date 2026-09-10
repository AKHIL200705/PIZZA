import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Flame,
  Star,
  Sparkles,
  SlidersHorizontal,
  ChefHat,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAddToCart, usePizzas, type Pizza } from "@/lib/data";
import { inr } from "@/lib/format";
import { pizzaImage } from "@/lib/images";
import { btnGhost, btnPrimary, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Pizza Menu — Stone-Fired Signature Pizzas | PizzaHub" },
      {
        name: "description",
        content:
          "Explore PizzaHub's signature stone-fired pizzas with artisanal bases, fresh toppings, live stock availability, and instant online ordering.",
      },
      { property: "og:title", content: "Pizza Menu — Signature Pizzas | PizzaHub" },
      {
        property: "og:description",
        content: "Explore handcrafted signature pizzas with instant ordering.",
      },
    ],
  }),
  component: MenuPage,
});

export function PizzaCard({ pizza }: { pizza: Pizza }) {
  const { user } = useAuth();
  const addToCart = useAddToCart(user?.id);
  const [added, setAdded] = useState(false);

  const add = () => {
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
        onSuccess: () => {
          setAdded(true);
          toast.success(`${pizza.name} added to cart!`);
          setTimeout(() => setAdded(false), 2000);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const isVeg = !pizza.name.toLowerCase().includes("chicken") && !pizza.name.toLowerCase().includes("pepperoni");
  const isSpicy = pizza.name.toLowerCase().includes("spicy") || pizza.name.toLowerCase().includes("peri");
  const isBestseller = pizza.name.toLowerCase().includes("margherita") || pizza.name.toLowerCase().includes("paneer");

  return (
    <article className="glass-card group flex flex-col justify-between overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-2xl border border-border/80">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pizzaImage(pizza.image_key)}
          alt={pizza.name}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {/* Dietary Indicator */}
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-xs ${
              isVeg
                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                : "bg-red-950/80 text-red-400 border border-red-500/40"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isVeg ? "bg-emerald-400" : "bg-red-400"}`} />
            {isVeg ? "VEG" : "NON-VEG"}
          </span>

          {isBestseller && (
            <span className="rounded-full bg-amber-500/90 text-amber-950 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-xs">
              ★ Bestseller
            </span>
          )}

          {isSpicy && (
            <span className="rounded-full bg-red-600/90 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-background/85 px-3 py-1 text-sm font-extrabold text-foreground backdrop-blur-md border border-border shadow-xs">
          {inr(Number(pizza.price))}
        </div>

        {!pizza.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-xs text-sm font-bold uppercase tracking-widest text-destructive">
            Temporarily Sold Out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {pizza.name}
            </h3>
            <div className="flex items-center text-xs font-semibold text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
              <span>4.9</span>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {pizza.description}
          </p>
        </div>

        <div className="pt-3 border-t border-border/60 flex items-center gap-2">
          <Link
            to="/builder"
            className="flex-1 rounded-xl border border-border/80 bg-secondary/60 hover:bg-secondary py-2.5 text-center text-xs font-bold text-foreground transition-all"
          >
            Customize
          </Link>

          <button
            onClick={add}
            disabled={!pizza.is_available || addToCart.isPending}
            className={`${btnPrimary} flex-1 py-2.5 text-xs font-bold shadow-md hover:scale-[1.02]`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5 text-amber-200" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuPage() {
  const { data: pizzas, isLoading, error } = usePizzas();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "veg" | "bestseller" | "spicy">("all");

  const filteredPizzas = (pizzas ?? []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "veg") {
      return !p.name.toLowerCase().includes("chicken") && !p.name.toLowerCase().includes("pepperoni");
    }
    if (filter === "bestseller") {
      return p.name.toLowerCase().includes("margherita") || p.name.toLowerCase().includes("paneer");
    }
    if (filter === "spicy") {
      return p.name.toLowerCase().includes("spicy") || p.name.toLowerCase().includes("peri");
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Flame className="h-3.5 w-3.5" />
            <span>Stone-Fired Signatures</span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl lg:text-5xl text-foreground">
            Our Handcrafted Pizzas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Baked to blistered perfection in our 480°C stone hearth oven with 100% fresh daily stock.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pizza or toppings..."
            className="w-full rounded-2xl border border-border bg-card/60 pl-10 pr-4 py-2.5 text-xs outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 mt-8 mb-10">
        {[
          { key: "all", label: "All Pizzas" },
          { key: "veg", label: "🟢 Veg Specialties" },
          { key: "bestseller", label: "★ Bestsellers" },
          { key: "spicy", label: "🌶️ Spicy Hot" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load menu items. Please refresh or check your internet connection.
        </p>
      )}

      {/* Pizzas Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}

        {!isLoading && filteredPizzas.map((pizza) => (
          <PizzaCard key={pizza.id} pizza={pizza} />
        ))}
      </div>

      {!isLoading && filteredPizzas.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center my-8">
          <p className="font-display text-xl font-bold">No pizzas found matching "{search}"</p>
          <p className="text-xs text-muted-foreground mt-1">Try another search or build your own custom pizza!</p>
          <button onClick={() => setSearch("")} className="mt-4 text-xs text-primary underline">
            Clear search
          </button>
        </div>
      )}

      {/* Bottom Custom Builder Callout */}
      <div className="glass-card mt-16 flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl p-8 sm:p-10 border border-primary/30 shadow-xl bg-gradient-to-r from-card via-card to-primary/10">
        <div className="space-y-2 text-center md:text-left">
          <span className="rounded-md bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary uppercase">
            Infinite Combinations
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Want something unique? Build your own pizza.
          </h3>
          <p className="text-xs text-muted-foreground max-w-xl">
            Choose your dough, scratch sauce, cheeses, and farm-fresh toppings with our interactive visual builder.
          </p>
        </div>
        <Link
          to="/builder"
          className={`${btnPrimary} py-3.5 px-7 text-sm font-bold shadow-xl shrink-0`}
        >
          <ChefHat className="h-4 w-4" />
          <span>Launch Pizza Builder</span>
        </Link>
      </div>
    </div>
  );
}
