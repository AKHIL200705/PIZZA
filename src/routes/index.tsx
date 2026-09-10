import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChefHat,
  Clock,
  Flame,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
  Star,
  ArrowRight,
  Pizza as PizzaIcon,
  CheckCircle2,
} from "lucide-react";
import { usePizzas } from "@/lib/data";
import { inr } from "@/lib/format";
import { heroPizza, pizzaImage } from "@/lib/images";
import { btnGhost, btnPrimary, SectionTitle, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PizzaHub — Artisanal Stone-Fired Pizza & Custom Builder" },
      {
        name: "description",
        content:
          "Craft your custom pizza with 5 artisanal crusts, crushed San Marzano sauces, premium cheeses, and farm-fresh toppings. Stone-baked at 480°C and tracked live.",
      },
      { property: "og:title", content: "PizzaHub — Artisanal Stone-Fired Pizza" },
      {
        property: "og:description",
        content:
          "Build your perfect pizza layer-by-layer. Fast, fresh, and tracked live to your door.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    step: "01",
    icon: ChefHat,
    title: "Choose Your Crust",
    text: "From authentic hand-tossed Thin Crust to decadent molten Cheese Burst.",
    badge: "5 Artisanal Bases",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Layer the Sauce",
    text: "San Marzano crushed tomato, fiery marinara, creamy garlic, or basil pesto.",
    badge: "Scratch-Made",
  },
  {
    step: "03",
    icon: Flame,
    title: "Blanket with Cheese",
    text: "Generous blend of 100% whole milk mozzarella, aged cheddar, and parmesan.",
    badge: "100% Real Dairy",
  },
  {
    step: "04",
    icon: Truck,
    title: "Stone-Baked & Tracked",
    text: "Fired in our 480°C oven in 90 seconds and delivered in insulated pods.",
    badge: "Live GPS Tracking",
  },
];

const pillars = [
  {
    icon: Leaf,
    title: "48-Hour Cold Fermentation",
    subtitle: "Airy, digestibly light dough with distinct artisanal leopard-spotting.",
  },
  {
    icon: Flame,
    title: "480°C Stone Hearth",
    subtitle: "Blistered crust with molten bubbling centers that lock in aroma.",
  },
  {
    icon: Clock,
    title: "25-Minute Kitchen Clock",
    subtitle: "Tickets print on the line the moment you order. No stale reheating.",
  },
  {
    icon: ShieldCheck,
    title: "Live Stock Verification",
    subtitle: "Real-time inventory decrement guarantees you never wait for out-of-stock items.",
  },
];

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Verified Foodie",
    rating: 5,
    text: "The custom pizza builder is incredible! Picked a Cheese Burst with Spicy Marinara and Black Olives. Arrived bubbling hot in 22 minutes.",
  },
  {
    name: "Vikram Sen",
    role: "Regular Customer",
    rating: 5,
    text: "Live order tracking actually updates in real time. Watching it go from 'In Kitchen' to 'Sent to Delivery' while setting the table was peak convenience.",
  },
  {
    name: "Dr. Meera Kapoor",
    role: "Gourmet Enthusiast",
    rating: 5,
    text: "The crust quality rivals authentic Italian pizzerias. You can tell they use real cold-fermented dough and genuine mozzarella.",
  },
];

const ingredientTags = [
  { name: "Thin Crust", category: "Crust" },
  { name: "Cheese Burst", category: "Crust" },
  { name: "San Marzano Marinara", category: "Sauce" },
  { name: "Basil Pesto", category: "Sauce" },
  { name: "Whole Milk Mozzarella", category: "Cheese" },
  { name: "Smoked Gouda", category: "Cheese" },
  { name: "Crisp Bell Peppers", category: "Veggies" },
  { name: "Pickled Jalapeños", category: "Veggies" },
  { name: "Button Mushrooms", category: "Veggies" },
  { name: "Sweet Corn", category: "Veggies" },
];

function Home() {
  const { data: pizzas, isLoading } = usePizzas();
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredTags =
    activeCategory === "All"
      ? ingredientTags
      : ingredientTags.filter((t) => t.category === activeCategory);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-[800px] -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-24 sm:pt-20 sm:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline & Action */}
          <div className="space-y-6 lg:col-span-7">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Stone-Oven Fired · 100% Fresh Daily Stock</span>
            </div>

            {/* Master Headline */}
            <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.02]">
              Crafted by Fire. <br />
              <span className="ember-text">Perfected by You.</span>
            </h1>

            {/* Subheading */}
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              Build your signature pizza layer by layer with cold-fermented dough, crushed San
              Marzano tomatoes, and artisan cheeses. Stone-baked at 480°C and tracked live from our
              oven straight to your hands.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/builder"
                className={`${btnPrimary} py-3.5 px-7 text-base shadow-xl hover:shadow-primary/25 hover:scale-[1.02] transition-all`}
              >
                <Flame className="h-5 w-5 text-amber-200" aria-hidden />
                <span>Build Your Pizza</span>
              </Link>
              <Link
                to="/menu"
                className={`${btnGhost} py-3.5 px-6 text-base hover:border-primary/40 hover:bg-secondary/80 transition-all`}
              >
                <PizzaIcon className="h-5 w-5 text-primary" aria-hidden />
                <span>Explore Menu</span>
              </Link>
            </div>

            {/* Social Proof & Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/70 max-w-lg">
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-bold text-foreground text-sm">4.9 / 5</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">2,400+ Reviews</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-primary">
                  <Clock className="h-4 w-4" />
                  <span className="font-bold text-foreground text-sm">25 Mins</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Avg. Delivery</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-bold text-foreground text-sm">10,000+</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Custom Builds</p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating Interactive Showcase */}
          <div className="relative flex justify-center lg:col-span-5">
            {/* Glow Aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-amber-500/20 blur-2xl animate-pulse-glow" />

            {/* Central Pizza Presentation Card */}
            <div className="glass-card relative w-full max-w-md overflow-hidden rounded-3xl p-4 shadow-2xl border border-border/80 group">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={heroPizza}
                  alt="Artisanal hot stone-fired pizza pulled from the oven"
                  className="h-80 sm:h-96 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  width={800}
                  height={800}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="rounded-md bg-primary/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-xs">
                      Chef Special
                    </span>
                    <h3 className="font-display text-xl font-bold mt-1 text-foreground">
                      Margherita Rustica
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      San Marzano · Fiordilatte · Basil
                    </p>
                  </div>
                  <Link
                    to="/builder"
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
                  >
                    <span>Customize</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Floating Badge 1: Top-Left */}
              <div className="absolute -top-3 -left-3 rounded-2xl border border-border bg-card/90 px-3.5 py-2 shadow-xl backdrop-blur-md animate-float-slow hidden sm:flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Oven Temp</p>
                  <p className="text-xs font-bold text-foreground">480°C Stone Hearth</p>
                </div>
              </div>

              {/* Floating Badge 2: Bottom-Right */}
              <div className="absolute -bottom-3 -right-3 rounded-2xl border border-border bg-card/90 px-3.5 py-2 shadow-xl backdrop-blur-md animate-float-reverse hidden sm:flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Leaf className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">Ingredients</p>
                  <p className="text-xs font-bold text-foreground">100% Farm Fresh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PILLARS OF CRAFT ===================== */}
      <section className="border-y border-border/80 bg-secondary/30 py-16 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((item, idx) => (
              <div
                key={idx}
                className="group flex gap-4 rounded-2xl p-4 transition-all hover:bg-card/60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-110">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">{item.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURED PIZZAS ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
              Handcrafted Originals
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl text-foreground">
              Signature Bakes
            </h2>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <span>View Full 12+ Pizza Menu</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(pizzas ?? []).slice(0, 4).map((pizza) => (
              <div
                key={pizza.id}
                className="glass-card group flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={pizzaImage(pizza.image_key)}
                    alt={pizza.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md shadow-xs">
                    {inr(Number(pizza.price))}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {pizza.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {pizza.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Fresh in Stock
                    </span>
                    <Link
                      to="/menu"
                      className="rounded-lg bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===================== 4-STEP HOW IT WORKS ===================== */}
      <section className="border-y border-border/80 bg-card/40 py-24 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="The Pizza Creation Pipeline" title="How PizzaHub Works" />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-12">
            {steps.map((step) => (
              <div
                key={step.title}
                className="glass-card relative flex flex-col justify-between rounded-2xl p-7 border border-border/80 transition-all hover:border-primary/50 hover:shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-extrabold text-primary/40 group-hover:text-primary transition-colors">
                      {step.step}
                    </span>
                    <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {step.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>

                  <h3 className="font-display mt-5 text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/50 text-[11px] font-semibold text-primary flex items-center gap-1">
                  <span>Step {step.step} in Builder</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/builder" className={`${btnPrimary} px-8 py-3.5 text-sm font-bold shadow-lg`}>
              <ChefHat className="h-4 w-4" />
              <span>Launch the Custom Pizza Builder</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== INGREDIENT SPOTLIGHT ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Fresh Inventory on the Line
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl text-foreground">
              Always Fresh Ingredients
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["All", "Crust", "Sauce", "Cheese", "Veggies"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {filteredTags.map((item) => (
            <span
              key={item.name}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-4 py-2.5 text-xs font-medium text-foreground backdrop-blur-xs transition-transform hover:scale-105 hover:border-primary/40 shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>{item.name}</span>
              <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                {item.category}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="border-y border-border/80 bg-card/30 py-24 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="Pizza Lovers Speak" title="What Foodies Say About PizzaHub" />

          <div className="grid gap-6 md:grid-cols-3 mt-10">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="glass-card flex flex-col justify-between rounded-2xl p-7 border border-border/80 shadow-md"
              >
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-xs text-muted-foreground leading-relaxed italic">
                    "{t.text}"
                  </blockquote>
                </div>
                <figcaption className="mt-6 pt-4 border-t border-border/60">
                  <p className="font-display text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-[11px] text-primary">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HIGH-IMPACT CLOSING BANNER ===================== */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="glass-card relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center border border-primary/30 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-transparent to-amber-500/15" />
          <div className="relative space-y-4">
            <span className="inline-block rounded-full bg-primary/20 px-4 py-1 text-xs font-bold text-primary uppercase tracking-widest">
              Ready to Taste the Difference?
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-foreground">
              Your Pizza is 4 Steps Away. <br />
              <span className="ember-text">Build Yours Right Now.</span>
            </h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground leading-relaxed">
              Experience the power of custom stone-baked pizza crafted with fresh daily stock and
              delivered piping hot.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link to="/builder" className={`${btnPrimary} px-8 py-3.5 text-base shadow-xl`}>
                <Flame className="h-5 w-5" />
                <span>Start Custom Pizza Builder</span>
              </Link>
              <Link to="/menu" className={`${btnGhost} px-7 py-3.5 text-base`}>
                <span>Browse Signature Pizzas</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
