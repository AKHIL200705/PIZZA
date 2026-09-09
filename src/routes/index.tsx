import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, Clock, Flame, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { usePizzas } from "@/lib/data";
import { inr } from "@/lib/format";
import { heroPizza, pizzaImage } from "@/lib/images";
import { btnGhost, btnPrimary, SectionTitle, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PizzaHub — Your Perfect Pizza, Your Way" },
      {
        name: "description",
        content:
          "Build your own pizza from fresh bases, sauces, cheeses and veggies, pay securely and track every order live from our kitchen to your door.",
      },
      { property: "og:title", content: "PizzaHub — Your Perfect Pizza, Your Way" },
      {
        property: "og:description",
        content: "Build your own pizza, pay securely and track delivery live.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  { icon: ChefHat, title: "Build it", text: "Pick your base, sauce, cheese and veggies." },
  { icon: ShieldCheck, title: "Pay securely", text: "Sandbox checkout confirms your order instantly." },
  { icon: Flame, title: "We fire it", text: "Stone-oven baked the moment your ticket prints." },
  { icon: Truck, title: "Track it", text: "Live status from kitchen to your doorstep." },
];

const reasons = [
  { icon: Leaf, title: "Fresh daily stock", text: "Every ingredient is tracked in real time, so you never order something we ran out of." },
  { icon: Clock, title: "30-minute kitchen", text: "Tickets go straight to the line the second your payment clears." },
  { icon: Sparkles, title: "Endless combinations", text: "5 bases, 5 sauces, 4 cheeses and 8 vegetables — over 10,000 pizzas." },
];

const testimonials = [
  { name: "Ananya R.", text: "The builder is addictive. I made a paneer-jalapeño monster and it arrived hot in 26 minutes." },
  { name: "Vikram S.", text: "Live tracking actually works. Watched it go from kitchen to delivery while I set the table." },
  { name: "Meera K.", text: "Finally a pizza site that tells me what's in stock before I fall in love with a topping." },
];

function Home() {
  const { data: pizzas, isLoading } = usePizzas();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroPizza}
          alt="Freshly baked pizza pulled from a stone oven"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            Fresh · Fast · Yours
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-7xl">
            Your Perfect Pizza,
            <span className="ember-text"> Your Way.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Choose every layer yourself — base, sauce, cheese and a pile of veggies — then
            watch it travel from our oven to your door in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/builder" className={btnPrimary}>
              <Flame className="h-4 w-4" aria-hidden /> Build Your Pizza
            </Link>
            <Link to="/menu" className={btnGhost}>
              See the menu
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="Signature bakes" title="Featured pizzas" />
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(pizzas ?? []).slice(0, 4).map((pizza) => (
              <Link
                key={pizza.id}
                to="/menu"
                className="glass-card group overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
              >
                <img
                  src={pizzaImage(pizza.image_key)}
                  alt={pizza.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="space-y-1 p-4">
                  <h3 className="font-display text-lg font-bold">{pizza.name}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {pizza.description}
                  </p>
                  <p className="pt-1 font-semibold text-primary">{inr(Number(pizza.price))}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionTitle eyebrow="Four steps" title="How it works" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="glass-card rounded-2xl p-6">
                <span className="font-display text-4xl font-extrabold text-primary/40">
                  0{index + 1}
                </span>
                <step.icon className="mt-3 h-6 w-6 text-primary" aria-hidden />
                <h3 className="font-display mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle eyebrow="Why PizzaHub" title="Built around fresh stock" />
        <div className="grid gap-6 md:grid-cols-3">
          {reasons.map((reason) => (
            <div key={reason.title} className="glass-card rounded-2xl p-6">
              <reason.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="font-display mt-3 text-xl font-bold">{reason.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{reason.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular ingredients */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <SectionTitle eyebrow="On the line today" title="Popular ingredients" />
        <div className="flex flex-wrap gap-3">
          {[
            "Thin Crust",
            "Sourdough",
            "Classic Marinara",
            "Peri Peri",
            "Mozzarella",
            "Smoked Gouda",
            "Jalapeño",
            "Roasted Paprika",
            "Sweet Corn",
            "Black Olives",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionTitle eyebrow="Word of mouth" title="What our customers say" />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="glass-card rounded-2xl p-6">
                <blockquote className="text-sm text-muted-foreground">"{t.text}"</blockquote>
                <figcaption className="font-display mt-4 font-bold">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
          Hungry yet? <span className="ember-text">Start building.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Your pizza, exactly the way you want it — priced live as you pick each layer.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/builder" className={btnPrimary}>
            Build Your Pizza
          </Link>
          <Link to="/auth" className={btnGhost}>
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}
