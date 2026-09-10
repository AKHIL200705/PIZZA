import { useState, useEffect } from "react";
import { Flame, Sparkles, FastForward, CheckCircle2, ChevronRight } from "lucide-react";

interface SplashStep {
  label: string;
  detail: string;
  icon: string;
}

const STEPS: SplashStep[] = [
  {
    label: "Igniting Stone Oven",
    detail: "Reaching 500°C authentic Neapolitan heat",
    icon: "🔥",
  },
  {
    label: "Hand-Stretching Dough",
    detail: "48-hour slow-fermented artisan crust",
    icon: "🌾",
  },
  {
    label: "Layering Farm Ingredients",
    detail: "San Marzano tomatoes & fresh garden toppings",
    icon: "🍅",
  },
  {
    label: "Melting Artisan Cheese",
    detail: "Creamy Fior di Latte & golden mozzarella",
    icon: "🧀",
  },
  {
    label: "Ready for Delivery",
    detail: "Packed steaming hot in thermal eco-boxes",
    icon: "🍕",
  },
];

const TOTAL_DURATION_MS = 5000; // 5 seconds

export function SplashIntro() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const handleReplay = () => {
      sessionStorage.removeItem("pizzahub_splash_seen");
      setIsFadingOut(false);
      setProgress(0);
      setCurrentStepIndex(0);
      setIsVisible(true);
    };

    window.addEventListener("pizzahub:replay_splash", handleReplay);
    return () => window.removeEventListener("pizzahub:replay_splash", handleReplay);
  }, []);

  useEffect(() => {
    if (!isVisible || isFadingOut) return;

    // Check if already seen in current browser session
    const seen = sessionStorage.getItem("pizzahub_splash_seen");
    if (seen === "true") {
      setIsVisible(false);
      return;
    }

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / TOTAL_DURATION_MS) * 100);
      setProgress(pct);

      const stepIndex = Math.min(
        STEPS.length - 1,
        Math.floor((elapsed / TOTAL_DURATION_MS) * STEPS.length),
      );
      setCurrentStepIndex(stepIndex);

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        dismiss();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isVisible, isFadingOut]);

  const dismiss = () => {
    setIsFadingOut(true);
    sessionStorage.setItem("pizzahub_splash_seen", "true");
    setTimeout(() => {
      setIsVisible(false);
    }, 700);
  };

  if (!isVisible) return null;

  const currentStep = STEPS[currentStepIndex];
  const secondsLeft = Math.max(0, ((100 - progress) / 100) * 5).toFixed(1);

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-[#0d0908] text-white transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-label="Welcome to PizzaHub"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-rose-600/25 via-amber-500/20 to-orange-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px]" />

        {/* Ambient floating ember particles */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={dismiss}
          className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md transition-all hover:border-rose-500/50 hover:bg-white/10 hover:text-white"
        >
          <span>Skip Intro</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-amber-400 font-mono">
            {secondsLeft}s
          </span>
          <FastForward className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-rose-400" />
        </button>
      </div>

      {/* Main Showcase Container */}
      <div className="relative z-10 mx-4 flex w-full max-w-lg flex-col items-center text-center">
        {/* Animated Emblem / Fire Ring */}
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
          {/* Outer rotating dashed ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-spin"
            style={{ animationDuration: "12s" }}
          />

          {/* Glowing pulse ring */}
          <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 opacity-30 blur-md animate-ping" />

          {/* Central Oven Core */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-gradient-to-b from-[#241715] to-[#120a09] shadow-2xl shadow-rose-950/80 backdrop-blur-xl">
            <span
              className="text-5xl select-none animate-bounce"
              style={{ animationDuration: "2s" }}
            >
              {currentStep.icon}
            </span>
          </div>

          {/* Ember Sparkle Icon */}
          <div className="absolute -top-1 -right-1 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-1.5 shadow-lg shadow-amber-500/30">
            <Sparkles
              className="h-4 w-4 text-white animate-spin"
              style={{ animationDuration: "6s" }}
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-300">
            <Flame className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>Artisan Perfection</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl font-['Outfit'] bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
            PIZZAHUB
          </h1>

          <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-white/60">
            Crafted with Passion • Delivered with Perfection
          </p>
        </div>

        {/* Dynamic 5-Second Status Stage Card */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-2xl transition-all">
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-white/10 text-xl">
                {currentStep.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-white transition-all">{currentStep.label}</p>
                <p className="text-xs text-white/60">{currentStep.detail}</p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="font-mono text-xs font-bold text-amber-400">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Progress Track */}
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(244,63,94,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 5 Milestone Step Indicators */}
          <div className="mt-3 grid grid-cols-5 gap-1.5 pt-1">
            {STEPS.map((step, idx) => (
              <div
                key={step.label}
                className={`flex flex-col items-center gap-1 transition-all ${
                  idx <= currentStepIndex ? "opacity-100" : "opacity-30"
                }`}
              >
                <div
                  className={`h-1 w-full rounded-full transition-all duration-300 ${
                    idx < currentStepIndex
                      ? "bg-rose-500"
                      : idx === currentStepIndex
                        ? "bg-amber-400"
                        : "bg-white/15"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA / Enter prompt */}
        <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
          <span>Entering PizzaHub Kitchen</span>
          <ChevronRight className="h-3.5 w-3.5 animate-pulse text-amber-400" />
        </div>
      </div>
    </div>
  );
}
