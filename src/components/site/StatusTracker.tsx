import { Check } from "lucide-react";
import { ORDER_FLOW } from "@/lib/format";

/** Visual progress tracker for an order's lifecycle. */
export function StatusTracker({ status }: { status: string }) {
  if (status === "Cancelled") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive-foreground">
        This order was cancelled.
      </div>
    );
  }

  const current = Math.max(0, ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]));

  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-1 items-center gap-3 sm:flex-col sm:text-center">
            <div className="flex w-full items-center gap-3 sm:flex-col">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all ${
                  done
                    ? "ember-gradient glow border-transparent text-primary-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              {i < ORDER_FLOW.length - 1 && (
                <span
                  className={`hidden h-0.5 w-full sm:block ${
                    i < current ? "ember-gradient" : "bg-border"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
