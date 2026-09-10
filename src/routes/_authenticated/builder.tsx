import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShoppingCart,
  Flame,
  Sparkles,
  Info,
  Layers,
  Pizza as PizzaIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAddToCart, useIngredients, type Ingredient } from "@/lib/data";
import { CUSTOM_BASE_FEE, inr } from "@/lib/format";
import { btnGhost, btnPrimary, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Custom Pizza Builder — Craft Your Masterpiece | PizzaHub" },
      {
        name: "description",
        content:
          "Pick your crust, sauce, cheese, and farm-fresh toppings with a real-time interactive pizza canvas and instant live pricing.",
      },
      { property: "og:title", content: "Custom Pizza Builder | PizzaHub" },
      {
        property: "og:description",
        content: "Build your dream pizza step by step with live visual layering.",
      },
    ],
  }),
  component: Builder,
});

const STEPS = ["Crust", "Sauce", "Cheese", "Veggies", "Review"] as const;

/** Interactive Visual Pizza Canvas with Real-Time Layering */
function InteractivePizzaCanvas({
  base,
  sauce,
  cheese,
  veggies,
}: {
  base: Ingredient | null;
  sauce: Ingredient | null;
  cheese: Ingredient | null;
  veggies: Ingredient[];
}) {
  // Base crust appearance
  const crustColors: Record<string, { rim: string; inner: string; border: string }> = {
    "thin-crust": { rim: "#c48842", inner: "#e2af6f", border: "#8c561b" },
    "cheese-burst": { rim: "#d99238", inner: "#f6cf7f", border: "#f59e0b" },
    "pan-crust": { rim: "#b8762d", inner: "#db9e54", border: "#78410e" },
    "wheat-thin": { rim: "#966332", inner: "#b8834c", border: "#5e3816" },
    default: { rim: "#c48842", inner: "#deb074", border: "#8c561b" },
  };

  const currentCrust = base
    ? crustColors[base.id] || crustColors["default"]
    : crustColors["default"];

  // Sauce appearance
  const sauceColors: Record<string, string> = {
    "classic-tomato": "#b91c1c",
    "spicy-marinara": "#991b1b",
    "creamy-garlic": "#fef3c7",
    "bbq-sauce": "#451a03",
    "basil-pesto": "#15803d",
  };

  const currentSauce = sauce ? sauceColors[sauce.id] || "#b91c1c" : null;

  // Cheese appearance
  const cheeseColors: Record<string, string> = {
    mozzarella: "#fef08a",
    cheddar: "#fde047",
    parmesan: "#fef9c3",
    gouda: "#facc15",
    "vegan-cheese": "#fef08a",
  };

  const currentCheese = cheese ? cheeseColors[cheese.id] || "#fef08a" : null;

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-black p-4 shadow-2xl border border-border/80">
      {/* Stone Oven / Wooden Peel Texture Background */}
      <div className="absolute inset-2 rounded-full border border-amber-900/30 bg-radial from-amber-950/20 to-stone-950/90 shadow-inner" />

      {/* Floating glow aura */}
      <div className="absolute inset-8 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

      {/* Main Pizza Body */}
      <div
        className="relative h-64 w-64 sm:h-72 sm:w-72 rounded-full shadow-2xl transition-all duration-500"
        style={{
          backgroundColor: currentCrust.rim,
          border: `10px solid ${currentCrust.border}`,
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Cheese Burst ring highlight */}
        {base?.name?.toLowerCase().includes("burst") && (
          <div className="absolute inset-1 rounded-full border-4 border-dashed border-amber-300 opacity-80 animate-pulse-soft" />
        )}

        {/* Inner Dough Bed */}
        <div
          className="absolute inset-2 rounded-full transition-colors duration-500"
          style={{ backgroundColor: currentCrust.inner }}
        >
          {/* Sauce Layer */}
          {currentSauce && (
            <div
              className="absolute inset-2 rounded-full transition-all duration-700 animate-in fade-in zoom-in-95"
              style={{
                backgroundColor: currentSauce,
                opacity: 0.9,
                boxShadow: "inset 0 0 15px rgba(0,0,0,0.5)",
              }}
            >
              {/* Herb & seasoning flakes on sauce */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#14532d_1px,transparent_1px)] [background-size:12px_12px]" />
            </div>
          )}

          {/* Cheese Layer */}
          {currentCheese && (
            <div
              className="absolute inset-3 rounded-full transition-all duration-700 animate-in fade-in zoom-in-90"
              style={{
                backgroundColor: currentCheese,
                opacity: 0.88,
                boxShadow: "inset 0 0 10px rgba(180,83,9,0.4)",
              }}
            >
              {/* Melted bubbly cheese texture */}
              <div className="absolute top-6 left-8 h-4 w-6 rounded-full bg-amber-600/30 blur-[1px]" />
              <div className="absolute top-16 right-10 h-5 w-8 rounded-full bg-amber-600/35 blur-[1px]" />
              <div className="absolute bottom-10 left-16 h-6 w-9 rounded-full bg-amber-600/25 blur-[1px]" />
              <div className="absolute bottom-8 right-12 h-5 w-7 rounded-full bg-amber-700/30 blur-[1px]" />
              <div className="absolute top-28 left-24 h-4 w-5 rounded-full bg-amber-600/40 blur-[1px]" />
            </div>
          )}

          {/* Scattered Vegetable Toppings */}
          {veggies.map((veg) => {
            const vName = veg.name.toLowerCase();

            if (vName.includes("capsicum") || vName.includes("bell pepper")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-8 left-14 h-4 w-8 rounded-full border-2 border-emerald-500 bg-emerald-600/30 rotate-12" />
                  <div className="absolute top-20 right-14 h-4 w-9 rounded-full border-2 border-emerald-500 bg-emerald-600/30 -rotate-45" />
                  <div className="absolute bottom-14 left-10 h-4 w-8 rounded-full border-2 border-emerald-500 bg-emerald-600/30 rotate-45" />
                  <div className="absolute bottom-12 right-20 h-4 w-7 rounded-full border-2 border-emerald-500 bg-emerald-600/30 -rotate-12" />
                  <div className="absolute top-28 left-28 h-4 w-8 rounded-full border-2 border-emerald-500 bg-emerald-600/30 rotate-90" />
                </div>
              );
            }

            if (vName.includes("onion")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-12 right-24 h-2 w-7 rounded-full bg-fuchsia-800 rotate-45 border border-fuchsia-400" />
                  <div className="absolute top-24 left-12 h-2 w-8 rounded-full bg-fuchsia-800 -rotate-12 border border-fuchsia-400" />
                  <div className="absolute bottom-16 right-14 h-2 w-6 rounded-full bg-fuchsia-800 rotate-90 border border-fuchsia-400" />
                  <div className="absolute bottom-24 left-24 h-2 w-7 rounded-full bg-fuchsia-800 -rotate-45 border border-fuchsia-400" />
                </div>
              );
            }

            if (vName.includes("olive")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-10 left-20 h-4 w-4 rounded-full border-3 border-black bg-transparent" />
                  <div className="absolute top-28 right-16 h-4 w-4 rounded-full border-3 border-black bg-transparent" />
                  <div className="absolute bottom-20 left-16 h-4 w-4 rounded-full border-3 border-black bg-transparent" />
                  <div className="absolute bottom-8 right-24 h-4 w-4 rounded-full border-3 border-black bg-transparent" />
                  <div className="absolute top-20 left-32 h-4 w-4 rounded-full border-3 border-black bg-transparent" />
                </div>
              );
            }

            if (vName.includes("mushroom")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-16 left-16 h-5 w-6 rounded-t-full bg-stone-700 rotate-12 border-b-2 border-stone-900" />
                  <div className="absolute top-14 right-18 h-5 w-6 rounded-t-full bg-stone-700 -rotate-30 border-b-2 border-stone-900" />
                  <div className="absolute bottom-12 left-24 h-5 w-6 rounded-t-full bg-stone-700 rotate-45 border-b-2 border-stone-900" />
                  <div className="absolute bottom-24 right-12 h-5 w-6 rounded-t-full bg-stone-700 -rotate-12 border-b-2 border-stone-900" />
                </div>
              );
            }

            if (vName.includes("corn")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-14 left-28 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                  <div className="absolute top-24 right-28 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                  <div className="absolute bottom-16 left-28 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                  <div className="absolute bottom-28 right-20 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                  <div className="absolute top-22 left-18 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                  <div className="absolute bottom-10 left-18 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-xs" />
                </div>
              );
            }

            if (vName.includes("jalapeno") || vName.includes("jalapeño")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-18 left-22 h-4 w-4 rounded-full border-3 border-emerald-700 bg-emerald-900/80" />
                  <div className="absolute top-30 right-22 h-4 w-4 rounded-full border-3 border-emerald-700 bg-emerald-900/80" />
                  <div className="absolute bottom-18 right-28 h-4 w-4 rounded-full border-3 border-emerald-700 bg-emerald-900/80" />
                  <div className="absolute bottom-26 left-14 h-4 w-4 rounded-full border-3 border-emerald-700 bg-emerald-900/80" />
                </div>
              );
            }

            if (vName.includes("tomato")) {
              return (
                <div
                  key={veg.id}
                  className="absolute inset-0 pointer-events-none animate-in fade-in zoom-in-90 duration-300"
                >
                  <div className="absolute top-12 left-12 h-3.5 w-3.5 rounded-sm bg-red-600 rotate-12 shadow-xs" />
                  <div className="absolute top-26 right-12 h-3.5 w-3.5 rounded-sm bg-red-600 -rotate-25 shadow-xs" />
                  <div className="absolute bottom-14 right-18 h-3.5 w-3.5 rounded-sm bg-red-600 rotate-45 shadow-xs" />
                  <div className="absolute bottom-22 left-20 h-3.5 w-3.5 rounded-sm bg-red-600 -rotate-12 shadow-xs" />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Floating Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-md border border-border">
        <Flame className="h-3.5 w-3.5 text-primary" />
        <span>480°C Live Visualizer</span>
      </div>
    </div>
  );
}

function OptionCard({
  item,
  selected,
  onSelect,
}: {
  item: Ingredient;
  selected: boolean;
  onSelect: () => void;
}) {
  const out = item.stock_qty <= 0;

  return (
    <button
      type="button"
      disabled={out}
      onClick={onSelect}
      className={`glass-card group relative flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-all duration-200 disabled:opacity-40 ${
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.01]"
          : "hover:-translate-y-1 hover:border-primary/40 hover:bg-secondary/70"
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </span>
          {selected && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">
            {out ? (
              <span className="text-destructive font-bold">Out of stock</span>
            ) : item.price > 0 ? (
              `+ ${inr(item.price)}`
            ) : (
              <span className="text-emerald-400">Included</span>
            )}
          </span>
          <span className="text-muted-foreground text-[11px]">({item.stock_qty} left)</span>
        </div>
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-xs"
            : "border-border bg-secondary/50 text-muted-foreground group-hover:border-primary/40"
        }`}
      >
        <Check className={`h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
      </div>
    </button>
  );
}

function Builder() {
  const { user } = useAuth();
  const { data: ingredients, isLoading } = useIngredients();
  const addToCart = useAddToCart(user?.id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Ingredient | null>(null);
  const [sauce, setSauce] = useState<Ingredient | null>(null);
  const [cheese, setCheese] = useState<Ingredient | null>(null);
  const [veggies, setVeggies] = useState<Ingredient[]>([]);

  const byCategory = (category: Ingredient["category"]) =>
    (ingredients ?? []).filter((i) => i.category === category);

  const price = useMemo(
    () =>
      CUSTOM_BASE_FEE +
      Number(base?.price ?? 0) +
      Number(sauce?.price ?? 0) +
      Number(cheese?.price ?? 0) +
      veggies.reduce((sum, v) => sum + Number(v.price), 0),
    [base, sauce, cheese, veggies],
  );

  const canContinue =
    (step === 0 && base) ||
    (step === 1 && sauce) ||
    (step === 2 && cheese) ||
    step === 3 ||
    step === 4;

  const toggleVeggie = (item: Ingredient) =>
    setVeggies((current) =>
      current.some((v) => v.id === item.id)
        ? current.filter((v) => v.id !== item.id)
        : [...current, item],
    );

  const addPizza = () => {
    if (!base || !sauce || !cheese) return;
    addToCart.mutate(
      {
        name: `Custom ${base.name} Pizza`,
        image_key: "custom",
        unit_price: price,
        quantity: 1,
        ingredient_ids: [base.id, sauce.id, cheese.id, ...veggies.map((v) => v.id)],
        details: {
          type: "custom",
          base: base.name,
          sauce: sauce.name,
          cheese: cheese.name,
          veggies: veggies.map((v) => v.name),
        },
      },
      {
        onSuccess: () => {
          toast.success("Custom pizza added to your cart!");
          navigate({ to: "/cart" });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-14">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Flame className="h-3.5 w-3.5" />
            <span>Interactive Custom Pizzeria</span>
          </div>
          <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl text-foreground">
            Build Your Perfect Pizza
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch your creation take shape in real time as you pick each layer.
          </p>
        </div>

        {/* Step counter pill */}
        <div className="rounded-xl border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2 shadow-xs">
          <span>
            Step {step + 1} of {STEPS.length}:
          </span>
          <span className="font-bold text-foreground">{STEPS[step]}</span>
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <ol className="mt-8 flex flex-wrap gap-2.5">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              // Allow jumping back to earlier completed steps
              if (i <= step) setStep(i);
            }}
            disabled={i > step}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed ${
              i === step
                ? "ember-gradient text-primary-foreground shadow-md scale-105"
                : i < step
                  ? "bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer"
                  : "bg-secondary/40 text-muted-foreground opacity-50"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/20 text-[10px]">
              {i + 1}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Left: Ingredient Selector by Step */}
        <div className="space-y-6">
          {step === 0 && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold">Step 1: Choose Your Crust</h2>
                <p className="text-xs text-muted-foreground">
                  Every great pizza starts with an artisanal crust.
                </p>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {byCategory("base").map((i) => (
                  <OptionCard
                    key={i.id}
                    item={i}
                    selected={base?.id === i.id}
                    onSelect={() => setBase(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold">Step 2: Spread the Sauce</h2>
                <p className="text-xs text-muted-foreground">
                  Scratch-made sauces lightly simmered to perfection.
                </p>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {byCategory("sauce").map((i) => (
                  <OptionCard
                    key={i.id}
                    item={i}
                    selected={sauce?.id === i.id}
                    onSelect={() => setSauce(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold">Step 3: Blanket with Cheese</h2>
                <p className="text-xs text-muted-foreground">
                  100% whole milk dairy that melts to golden blistered perfection.
                </p>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {byCategory("cheese").map((i) => (
                  <OptionCard
                    key={i.id}
                    item={i}
                    selected={cheese?.id === i.id}
                    onSelect={() => setCheese(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-4">
                <h2 className="font-display text-2xl font-bold">
                  Step 4: Pile on Veggies & Toppings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select multiple toppings. Each ingredient is prepped fresh daily.
                </p>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {byCategory("veggie").map((i) => (
                  <OptionCard
                    key={i.id}
                    item={i}
                    selected={veggies.some((v) => v.id === i.id)}
                    onSelect={() => toggleVeggie(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="glass-card space-y-5 rounded-3xl p-7 shadow-xl border border-primary/30">
              <div>
                <span className="rounded-md bg-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary uppercase">
                  Ready for the Oven
                </span>
                <h2 className="font-display text-2xl font-bold mt-2">Recipe Summary</h2>
                <p className="text-xs text-muted-foreground">
                  Review your customized pizza before sending it to the kitchen.
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                {[
                  ["Artisanal Crust", base?.name],
                  ["Simmered Sauce", sauce?.name],
                  ["Melted Cheese", cheese?.name],
                  [
                    "Fresh Toppings",
                    veggies.map((v) => v.name).join(", ") || "No additional toppings",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-border/80 pb-2.5"
                  >
                    <dt className="text-muted-foreground font-medium">{label}</dt>
                    <dd className="text-right font-bold text-foreground">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="text-base font-bold text-foreground">Total Price</dt>
                  <dd className="font-display text-2xl font-extrabold text-primary">
                    {inr(price)}
                  </dd>
                </div>
              </dl>

              <button
                onClick={addPizza}
                disabled={addToCart.isPending || !base || !sauce || !cheese}
                className={`${btnPrimary} w-full py-3.5 text-base shadow-xl hover:scale-[1.01]`}
              >
                <ShoppingCart className="h-5 w-5" aria-hidden />
                <span>Add Custom Pizza to Cart · {inr(price)}</span>
              </button>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between gap-3 pt-4 border-t border-border/60">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={`${btnGhost} px-5`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span>Back</span>
            </button>

            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
                className={`${btnPrimary} px-6 shadow-md`}
              >
                <span>Continue to {STEPS[step + 1]}</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* Right: Sticky Visual Pizza Canvas & Live Receipt */}
        <aside className="glass-card h-fit space-y-5 rounded-3xl p-6 shadow-xl border border-border/80 lg:sticky lg:top-24">
          <InteractivePizzaCanvas base={base} sauce={sauce} cheese={cheese} veggies={veggies} />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">Live Recipe</h3>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Fresh Stock
              </span>
            </div>

            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground divide-y divide-border/40">
              <li className="pt-1.5 flex justify-between">
                <span>Crust:</span>
                <strong className="text-foreground font-semibold">
                  {base?.name ?? "Pick Crust"}
                </strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Sauce:</span>
                <strong className="text-foreground font-semibold">
                  {sauce?.name ?? "Pick Sauce"}
                </strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Cheese:</span>
                <strong className="text-foreground font-semibold">
                  {cheese?.name ?? "Pick Cheese"}
                </strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Toppings ({veggies.length}):</span>
                <strong className="text-foreground font-semibold text-right">
                  {veggies.length ? veggies.map((v) => v.name).join(", ") : "None chosen"}
                </strong>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Current Total
              </p>
              <p className="font-display text-2xl font-extrabold text-primary">{inr(price)}</p>
            </div>
            {step < STEPS.length - 1 && canContinue && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground px-3.5 py-2 text-xs font-bold transition-colors"
              >
                Next Step →
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
