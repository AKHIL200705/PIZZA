import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, AlertTriangle, CheckCircle2, XCircle, Package } from "lucide-react";
import { useIngredients, useUpdateStock } from "@/lib/data";
import { AdminShell } from "@/components/site/AdminShell";
import { inputClass, Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Management — PizzaHub Kitchen Console" },
      {
        name: "description",
        content:
          "Track bases, sauces, cheeses and vegetables, adjust stock and set low-stock thresholds.",
      },
      { property: "og:title", content: "Inventory Management — PizzaHub" },
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

  const allIngredients = ingredients ?? [];
  const totalItems = allIngredients.length;
  const outOfStock = allIngredients.filter((i) => i.stock_qty <= 0);
  const lowStock = allIngredients.filter(
    (i) => i.stock_qty > 0 && i.stock_qty <= i.low_stock_threshold
  );
  const inStock = allIngredients.filter((i) => i.stock_qty > i.low_stock_threshold);

  const adjustDelta = (id: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    updateStock.mutate(
      { id, stock_qty: next },
      {
        onSuccess: () => toast.success("Stock quantity updated"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const setExactStock = (id: string, value: number) => {
    if (isNaN(value) || value < 0) {
      toast.error("Stock quantity cannot be negative");
      return;
    }
    updateStock.mutate(
      { id, stock_qty: Math.max(0, Math.round(value)) },
      {
        onSuccess: () => toast.success("Stock level updated"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const setThreshold = (id: string, stock: number, value: number) => {
    if (isNaN(value) || value < 0) {
      toast.error("Threshold cannot be negative");
      return;
    }
    updateStock.mutate(
      { id, stock_qty: stock, low_stock_threshold: Math.max(0, Math.round(value)) },
      {
        onSuccess: () => toast.success("Low-stock threshold updated"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <AdminShell title="Inventory & Stock Management">
      {/* Metric Cards (Requirement #9) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="glass-card rounded-2xl p-5 border border-border/80">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <Package className="h-4 w-4 text-primary" /> Total Inventory Items
          </div>
          <p className="font-display mt-2 text-3xl font-extrabold">{totalItems}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border/80">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" /> Healthy In-Stock
          </div>
          <p className="font-display mt-2 text-3xl font-extrabold text-emerald-500">{inStock.length}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border/80">
          <div className="flex items-center gap-2 text-warning text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" /> Low-Stock Alert
          </div>
          <p className="font-display mt-2 text-3xl font-extrabold text-warning">{lowStock.length}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border/80">
          <div className="flex items-center gap-2 text-destructive text-xs font-semibold uppercase tracking-wider">
            <XCircle className="h-4 w-4" /> Out of Stock
          </div>
          <p className="font-display mt-2 text-3xl font-extrabold text-destructive">{outOfStock.length}</p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ key: "all", label: "All Items" }, ...CATEGORIES].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              filter === c.key
                ? "ember-gradient text-primary-foreground shadow-md"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl border border-border/80 shadow-xl">
          <table className="w-full min-w-[50rem] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/30">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Low Stock Threshold</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody>
              {allIngredients
                .filter((i) => filter === "all" || i.category === filter)
                .map((i) => {
                  const isOutOfStock = i.stock_qty <= 0;
                  const isLowStock = !isOutOfStock && i.stock_qty <= i.low_stock_threshold;

                  return (
                    <tr key={i.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                      <td className="p-4 font-semibold text-foreground">{i.name}</td>
                      <td className="p-4 capitalize text-muted-foreground">{i.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={i.stock_qty}
                            key={`stock-${i.id}-${i.stock_qty}`}
                            onBlur={(e) => setExactStock(i.id, Number(e.target.value))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className={`${inputClass} w-20 px-2.5 py-1 text-center font-bold`}
                            aria-label={`Exact stock for ${i.name}`}
                          />
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={i.low_stock_threshold}
                            key={`thresh-${i.id}-${i.low_stock_threshold}`}
                            onBlur={(e) => setThreshold(i.id, i.stock_qty, Number(e.target.value))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className={`${inputClass} w-20 px-2.5 py-1 text-center`}
                            aria-label={`${i.name} low stock threshold`}
                          />
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                            isOutOfStock
                              ? "bg-destructive/20 text-destructive border border-destructive/30"
                              : isLowStock
                                ? "bg-warning/20 text-warning border border-warning/30"
                                : "bg-success/20 text-success border border-success/30"
                          }`}
                        >
                          {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "IN STOCK"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            aria-label={`Decrease ${i.name} stock by 1`}
                            onClick={() => adjustDelta(i.id, i.stock_qty, -1)}
                            disabled={i.stock_qty <= 0}
                            className="rounded-lg border border-border p-1.5 hover:bg-secondary disabled:opacity-40 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            aria-label={`Increase ${i.name} stock by 1`}
                            onClick={() => adjustDelta(i.id, i.stock_qty, 1)}
                            className="rounded-lg border border-border p-1.5 hover:bg-secondary transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            onClick={() => adjustDelta(i.id, i.stock_qty, 10)}
                            className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-semibold hover:bg-secondary transition-colors"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => adjustDelta(i.id, i.stock_qty, 50)}
                            className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            +50
                          </button>
                        </div>
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
