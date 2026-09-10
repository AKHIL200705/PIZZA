import { Check, ChefHat, Flame, Truck, CheckCircle2 } from "lucide-react";
import { ORDER_FLOW } from "@/lib/format";

/** Visual progress tracker for an order's lifecycle. */
export function StatusTracker({ status }: { status: string }) {
  const norm = status?.toLowerCase().replace(/\s+/g, "_") || "received";

  if (norm === "cancelled") {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm font-semibold text-destructive">
        This order was cancelled.
      </div>
    );
  }

  // Normalize step index
  let current = 0;
  if (norm.includes("kitchen")) current = 1;
  else if (norm.includes("delivery") || norm.includes("sent")) current = 2;
  else if (norm.includes("delivered")) current = 3;

  const icons = [CheckCircle2, Flame, Truck, ChefHat];

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ORDER_FLOW.map((step, i) => {
          const isCompleted = i <= current;
          const isCurrent = i === current;
          const StepIcon = icons[i] || Check;

          return (
            <li
              key={step}
              className={`glass-card relative flex flex-col items-center justify-between rounded-2xl p-5 text-center transition-all ${
                isCurrent
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/15 scale-[1.02]"
                  : isCompleted
                    ? "border-border/80 bg-secondary/60"
                    : "border-border/40 bg-secondary/20 opacity-50"
              }`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                    isCompleted
                      ? "ember-gradient text-primary-foreground border-transparent shadow-md"
                      : "border-border bg-secondary/50 text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-5 w-5" aria-hidden />
                </span>

                <h4 className="font-display mt-3 text-sm font-bold text-foreground">
                  {step}
                </h4>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
                {isCurrent ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span>In Progress</span>
                  </span>
                ) : isCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Done
                  </span>
                ) : (
                  <span className="text-muted-foreground">Upcoming</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
