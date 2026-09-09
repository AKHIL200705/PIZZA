import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { useIngredients, useUpdateStock } from "@/lib/data";
import { AdminShell } from "@/components/site/AdminShell";
import { inputClass, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory management — PizzaHub kitchen console" },
      {
        name: "description",
        content:
          "Track bases, sauces, cheeses and vegetables, adjust stock and set low-stock thresholds.",
      },
      { property: "og:title", content: "Inventory management — PizzaHub" },
      { property: "og:description", content: "Track and adjust ingredient stock levels." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Inventory,
});

const CATEGORIES = [
  { key: "base", label: "Pizza bases" },
  { key: "sauce", label: "Sauces" },
  { key: "cheese", label: "Cheese" },
  { key: "veggie", label: "Vegetables" },
] as const;

function Inventory() {
  const { data: ingredients, isLoading } = useIngredients();
  const updateStock = useUpdateStock();
  const [filter, setFilter] = useState<string>("all");

  const adjust = (id: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    updateStock.mutate(
      { id, stock_qty: next },
      { onError: (e) => toast.error(e.message) },
    );
  };

  const setThreshold = (id: string, stock: number, value: number) =>
    updateStock.mutate(
      { id, stock_qty: stock, low_stock_threshold: Math.max(0, value) },
      { onError: (e) => toast.error(e.message) },
    );

  return (
    <AdminShell title="Inventory">
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ key: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === c.key
                ? "ember-gradient text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Threshold</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(ingredients ?? [])
                .filter((i) => filter === "all" || i.category === filter)
                .map((i) => {
                  const low = i.stock_qty < i.low_stock_threshold;
                  return (
                    <tr key={i.id} className="border-b border-border/60 last:border-0">
                      <td className="p-4 font-medium">{i.name}</td>
                      <td className="p-4 capitalize text-muted-foreground">{i.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            aria-label={`Decrease ${i.name} stock`}
                            onClick={() => adjust(i.id, i.stock_qty, -1)}
                            className="rounded-lg border border-border p-1.5 hover:bg-secondary"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="w-10 text-center font-semibold">{i.stock_qty}</span>
                          <button
                            aria-label={`Increase ${i.name} stock`}
                            onClick={() => adjust(i.id, i.stock_qty, 1)}
                            className="rounded-lg border border-border p-1.5 hover:bg-secondary"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            onClick={() => adjust(i.id, i.stock_qty, 10)}
                            className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-secondary"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          defaultValue={i.low_stock_threshold}
                          onBlur={(e) =>
                            setThreshold(i.id, i.stock_qty, Number(e.target.value))
                          }
                          className={`${inputClass} w-24 px-3 py-1.5`}
                          aria-label={`${i.name} low stock threshold`}
                        />
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            i.stock_qty === 0
                              ? "bg-destructive/20 text-destructive"
                              : low
                                ? "bg-warning/20 text-warning"
                                : "bg-success/20 text-success"
                          }`}
                        >
                          {i.stock_qty === 0 ? "Out of stock" : low ? "Low stock" : "Healthy"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
