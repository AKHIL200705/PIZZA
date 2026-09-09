import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAddToCart, useIngredients, type Ingredient } from "@/lib/data";
import { CUSTOM_BASE_FEE, inr } from "@/lib/format";
import { heroPizza } from "@/lib/images";
import { btnGhost, btnPrimary, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Pizza Builder — Create your own pizza | PizzaHub" },
      {
        name: "description",
        content:
          "Choose your base, sauce, cheese and toppings step by step and watch the price update live before adding to your cart.",
      },
      { property: "og:title", content: "Pizza Builder — Create your own pizza | PizzaHub" },
      {
        property: "og:description",
        content: "Build a pizza step by step with live pricing at PizzaHub.",
      },
    ],
  }),
  component: Builder,
});

const STEPS = ["Base", "Sauce", "Cheese", "Veggies", "Review"] as const;

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
      className={`glass-card flex items-center justify-between gap-3 rounded-xl px-4 py-4 text-left transition-all disabled:opacity-40 ${
        selected ? "glow border-primary" : "hover:-translate-y-0.5"
      }`}
    >
      <span>
        <span className="block font-semibold">{item.name}</span>
        <span className="text-xs text-muted-foreground">
          {out ? "Out of stock" : item.price > 0 ? `+ ${inr(item.price)}` : "Included"}
        </span>
      </span>
      {selected && <Check className="h-4 w-4 text-primary" aria-hidden />}
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
          toast.success("Custom pizza added to your cart");
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
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Step {step + 1} of {STEPS.length}
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">
        Build your pizza
      </h1>

      <ol className="mt-6 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              i === step
                ? "ember-gradient text-primary-foreground"
                : i < step
                  ? "bg-secondary text-foreground"
                  : "bg-secondary/50 text-muted-foreground"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {byCategory("base").map((i) => (
                <OptionCard
                  key={i.id}
                  item={i}
                  selected={base?.id === i.id}
                  onSelect={() => setBase(i)}
                />
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {byCategory("sauce").map((i) => (
                <OptionCard
                  key={i.id}
                  item={i}
                  selected={sauce?.id === i.id}
                  onSelect={() => setSauce(i)}
                />
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {byCategory("cheese").map((i) => (
                <OptionCard
                  key={i.id}
                  item={i}
                  selected={cheese?.id === i.id}
                  onSelect={() => setCheese(i)}
                />
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byCategory("veggie").map((i) => (
                <OptionCard
                  key={i.id}
                  item={i}
                  selected={veggies.some((v) => v.id === i.id)}
                  onSelect={() => toggleVeggie(i)}
                />
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="glass-card space-y-3 rounded-2xl p-6">
              <h2 className="font-display text-xl font-bold">Your creation</h2>
              <dl className="space-y-2 text-sm">
                {[
                  ["Base", base?.name],
                  ["Sauce", sauce?.name],
                  ["Cheese", cheese?.name],
                  ["Veggies", veggies.map((v) => v.name).join(", ") || "None"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-border pb-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={addPizza}
                disabled={addToCart.isPending || !base || !sauce || !cheese}
                className={`${btnPrimary} w-full`}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden /> Add to cart · {inr(price)}
              </button>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className={btnGhost}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
                className={btnPrimary}
              >
                Continue <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <aside className="glass-card h-fit space-y-4 rounded-2xl p-5 lg:sticky lg:top-24">
          <img
            src={heroPizza}
            alt="Your custom pizza preview"
            loading="lazy"
            width={1536}
            height={1024}
            className="aspect-square w-full rounded-xl object-cover"
          />
          <h3 className="font-display text-lg font-bold">Live preview</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Base: {base?.name ?? "—"}</li>
            <li>Sauce: {sauce?.name ?? "—"}</li>
            <li>Cheese: {cheese?.name ?? "—"}</li>
            <li>Toppings: {veggies.length ? veggies.map((v) => v.name).join(", ") : "—"}</li>
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Current price</span>
            <span className="font-display text-2xl font-extrabold">{inr(price)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
