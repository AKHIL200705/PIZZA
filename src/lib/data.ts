import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Ingredient = {
  id: string;
  name: string;
  category: "base" | "sauce" | "cheese" | "veggie";
  price: number;
  stock_qty: number;
  low_stock_threshold: number;
  sort_order: number;
};

export type Pizza = {
  id: string;
  name: string;
  description: string;
  image_key: string;
  price: number;
  is_available: boolean;
  ingredient_ids: string[];
};

export type CartItem = {
  id: string;
  name: string;
  image_key: string;
  unit_price: number;
  quantity: number;
  ingredient_ids: string[];
  details: Record<string, unknown>;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  customer_name: string;
  phone: string;
  address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_id: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  name: string;
  image_key: string;
  unit_price: number;
  quantity: number;
  details: Record<string, unknown>;
};

/* ---------- catalogue ---------- */

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data as Ingredient[];
    },
  });
}

export function usePizzas() {
  return useQuery({
    queryKey: ["pizzas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pizzas").select("*").order("price");
      if (error) throw error;
      return data as Pizza[];
    },
  });
}

/* ---------- cart ---------- */

export function useCart(userId?: string) {
  return useQuery({
    queryKey: ["cart", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as CartItem[];
    },
  });
}

export function useAddToCart(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      name: string;
      image_key: string;
      unit_price: number;
      quantity: number;
      ingredient_ids: string[];
      details: Record<string, unknown>;
    }) => {
      if (!userId) throw new Error("Please sign in first");
      const row = { ...item, user_id: userId, details: item.details as never };
      const { error } = await supabase.from("cart_items").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

/* ---------- orders ---------- */

export function useMyOrders(userId?: string) {
  return useQuery({
    queryKey: ["orders", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;
      return { order: order as Order | null, items: (items ?? []) as OrderItem[] };
    },
  });
}

/* ---------- admin ---------- */

export function useAllOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-orders"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      stock_qty,
      low_stock_threshold,
    }: {
      id: string;
      stock_qty: number;
      low_stock_threshold?: number;
    }) => {
      const patch =
        typeof low_stock_threshold === "number"
          ? { stock_qty, low_stock_threshold }
          : { stock_qty };
      const { error } = await supabase.from("ingredients").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useCustomers(enabled: boolean) {
  return useQuery({
    queryKey: ["customers"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        address: string;
        created_at: string;
      }[];
    },
  });
}
