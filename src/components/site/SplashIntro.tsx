import { useState, useEffect } from "react";

export function SplashIntro() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [phase, setPhase] = useState<"enter" | "reveal" | "ready">("enter");

  const dismiss = () => {
    setIsFadingOut(true);
    sessionStorage.setItem("pizzahub_splash_seen", "true");
    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  };

  useEffect(() => {
    // Replay handler
    const handleReplay = () => {
      sessionStorage.removeItem("pizzahub_splash_seen");
      setIsFadingOut(false);
      setPhase("enter");
      setIsVisible(true);
    };

    window.addEventListener("pizzahub:replay_splash", handleReplay);
    return () => window.removeEventListener("pizzahub:replay_splash", handleReplay);
  }, []);

  useEffect(() => {
    if (!isVisible || isFadingOut) return;

    // Check if previously seen in this session
    const seen = sessionStorage.getItem("pizzahub_splash_seen");
    if (seen === "true") {
      setIsVisible(false);
      return;
    }

    // Elegant, simple animation choreography:
    // 0s - 0.8s: Icon and ambient glow bloom
    // 0.8s - 3.8s: Title reveals with subtle tracking expansion
    // 3.8s - 5.0s: Warm settle & smooth exit
    const t1 = setTimeout(() => setPhase("reveal"), 800);
    const t2 = setTimeout(() => setPhase("ready"), 3800);
    const t3 = setTimeout(() => dismiss(), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isVisible, isFadingOut]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#0c0a09] transition-opacity duration-700 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      {/* Subtle radial warm ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-rose-600/[0.08] rounded-full blur-[120px] transition-all duration-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-amber-500/[0.06] rounded-full blur-[80px]" />
      </div>

      {/* Minimal Skip text */}
      <div className="absolute top-8 right-8 z-20">
        <button
          type="button"
          onClick={dismiss}
          className="text-xs tracking-wider uppercase text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer py-1 px-2.5 rounded-full border border-white/5 hover:border-white/10"
        >
          Skip
        </button>
      </div>

      {/* Central Clean Brand Presentation */}
      <div className="relative z-10 flex flex-col items-center select-none px-6">
        {/* Modern Vector Pizza Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle glowing aura */}
          <div
            className={`absolute -inset-4 rounded-full bg-gradient-to-tr from-rose-500/20 to-amber-500/20 blur-xl transition-all duration-1000 ${
              phase !== "enter" ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          />

          {/* Clean minimal Pizza Icon */}
          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl backdrop-blur-md transition-all duration-700 ease-out ${
              phase !== "enter"
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-90 opacity-0 translate-y-4"
            }`}
          >
            <svg
              className="w-10 h-10 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 11h.01" />
              <path d="M11 15h.01" />
              <path d="M16 16h.01" />
              <path d="m2 16 20 6-6-20A20 20 0 0 0 2 16Z" />
              <path d="M5.71 17.11a17.09 17.09 0 0 1 11.4-11.4" />
            </svg>
          </div>
        </div>

        {/* Minimal Typography */}
        <div
          className={`flex flex-col items-center text-center transition-all duration-700 delay-150 ${
            phase !== "enter" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.22em] text-white font-['Outfit'] uppercase">
            PizzaHub
          </h1>

          <p className="mt-2.5 text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-400 font-medium">
            Handcrafted · Fresh · Delivered
          </p>
        </div>

        {/* Sleek Minimalist Progress Line */}
        <div className="mt-8 w-44 h-[2px] bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
            style={{
              animation: "splashFill 5s cubic-bezier(0.25, 1, 0.5, 1) forwards",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
