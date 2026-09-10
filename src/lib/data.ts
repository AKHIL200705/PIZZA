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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  items?: OrderItem[];
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

export const DEFAULT_INGREDIENTS: Ingredient[] = [
  {
    id: "base-1",
    name: "Thin Crust",
    category: "base",
    price: 0,
    stock_qty: 50,
    low_stock_threshold: 20,
    sort_order: 1,
  },
  {
    id: "base-2",
    name: "Cheese Burst",
    category: "base",
    price: 60,
    stock_qty: 45,
    low_stock_threshold: 15,
    sort_order: 2,
  },
  {
    id: "base-3",
    name: "Pan Crust",
    category: "base",
    price: 30,
    stock_qty: 50,
    low_stock_threshold: 20,
    sort_order: 3,
  },
  {
    id: "base-4",
    name: "Wheat Thin Crust",
    category: "base",
    price: 40,
    stock_qty: 35,
    low_stock_threshold: 15,
    sort_order: 4,
  },
  {
    id: "base-5",
    name: "Fresh Pan",
    category: "base",
    price: 20,
    stock_qty: 50,
    low_stock_threshold: 20,
    sort_order: 5,
  },

  {
    id: "sauce-1",
    name: "Classic Tomato",
    category: "sauce",
    price: 0,
    stock_qty: 50,
    low_stock_threshold: 20,
    sort_order: 1,
  },
  {
    id: "sauce-2",
    name: "Spicy Marinara",
    category: "sauce",
    price: 20,
    stock_qty: 40,
    low_stock_threshold: 15,
    sort_order: 2,
  },
  {
    id: "sauce-3",
    name: "Creamy Garlic",
    category: "sauce",
    price: 30,
    stock_qty: 30,
    low_stock_threshold: 10,
    sort_order: 3,
  },
  {
    id: "sauce-4",
    name: "BBQ Sauce",
    category: "sauce",
    price: 30,
    stock_qty: 45,
    low_stock_threshold: 15,
    sort_order: 4,
  },
  {
    id: "sauce-5",
    name: "Basil Pesto",
    category: "sauce",
    price: 40,
    stock_qty: 25,
    low_stock_threshold: 10,
    sort_order: 5,
  },

  {
    id: "cheese-1",
    name: "Mozzarella",
    category: "cheese",
    price: 50,
    stock_qty: 60,
    low_stock_threshold: 20,
    sort_order: 1,
  },
  {
    id: "cheese-2",
    name: "Cheddar",
    category: "cheese",
    price: 60,
    stock_qty: 50,
    low_stock_threshold: 15,
    sort_order: 2,
  },
  {
    id: "cheese-3",
    name: "Parmesan",
    category: "cheese",
    price: 70,
    stock_qty: 40,
    low_stock_threshold: 10,
    sort_order: 3,
  },
  {
    id: "cheese-4",
    name: "Gouda",
    category: "cheese",
    price: 80,
    stock_qty: 30,
    low_stock_threshold: 10,
    sort_order: 4,
  },
  {
    id: "cheese-5",
    name: "Vegan Cheese",
    category: "cheese",
    price: 75,
    stock_qty: 25,
    low_stock_threshold: 10,
    sort_order: 5,
  },

  {
    id: "veg-1",
    name: "Red Onion",
    category: "veggie",
    price: 30,
    stock_qty: 80,
    low_stock_threshold: 25,
    sort_order: 1,
  },
  {
    id: "veg-2",
    name: "Capsicum",
    category: "veggie",
    price: 30,
    stock_qty: 75,
    low_stock_threshold: 25,
    sort_order: 2,
  },
  {
    id: "veg-3",
    name: "Button Mushroom",
    category: "veggie",
    price: 45,
    stock_qty: 60,
    low_stock_threshold: 20,
    sort_order: 3,
  },
  {
    id: "veg-4",
    name: "Black Olives",
    category: "veggie",
    price: 40,
    stock_qty: 50,
    low_stock_threshold: 15,
    sort_order: 4,
  },
  {
    id: "veg-5",
    name: "Sweet Corn",
    category: "veggie",
    price: 35,
    stock_qty: 70,
    low_stock_threshold: 20,
    sort_order: 5,
  },
  {
    id: "veg-6",
    name: "Jalapenos",
    category: "veggie",
    price: 40,
    stock_qty: 55,
    low_stock_threshold: 15,
    sort_order: 6,
  },
  {
    id: "veg-7",
    name: "Fresh Tomatoes",
    category: "veggie",
    price: 25,
    stock_qty: 90,
    low_stock_threshold: 30,
    sort_order: 7,
  },
];

export const DEFAULT_PIZZAS: Pizza[] = [
  {
    id: "pizza-1",
    name: "Classic Margherita",
    description: "Classic blend of ripe tomatoes, creamy mozzarella & fresh basil herbs.",
    price: 299,
    image_key: "margherita",
    is_available: true,
    ingredient_ids: ["base-1", "sauce-1", "cheese-1"],
  },
  {
    id: "pizza-2",
    name: "Farmhouse Veggie",
    description: "Crisp capsicum, juicy tomatoes, red onions & succulent button mushrooms.",
    price: 399,
    image_key: "farmhouse",
    is_available: true,
    ingredient_ids: ["base-1", "sauce-1", "cheese-1", "veg-1", "veg-2", "veg-3"],
  },
  {
    id: "pizza-3",
    name: "Fiery Jalapeno & Corn",
    description: "Spicy jalapenos, golden sweet corn, chili flakes & extra cheddar melt.",
    price: 449,
    image_key: "supreme",
    is_available: true,
    ingredient_ids: ["base-2", "sauce-2", "cheese-2", "veg-5", "veg-6"],
  },
  {
    id: "pizza-4",
    name: "Smokey BBQ Paneer",
    description: "Tender paneer cubes smothered in rich BBQ sauce with crunchy onions.",
    price: 479,
    image_key: "bbq",
    is_available: true,
    ingredient_ids: ["base-3", "sauce-4", "cheese-1", "veg-1"],
  },
];

/* ---------- catalogue ---------- */

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ingredients`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            return data.map((i: any) => ({
              id: i._id || i.id,
              name: i.name,
              category: i.category,
              price: i.price,
              stock_qty: i.stock_qty,
              low_stock_threshold: i.low_stock_threshold,
              sort_order: i.sort_order || 0,
            })) as Ingredient[];
          }
        }
      } catch {
        // fallback
      }

      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("*")
          .order("category")
          .order("sort_order");
        if (error || !data || data.length === 0) return DEFAULT_INGREDIENTS;
        return data as Ingredient[];
      } catch {
        return DEFAULT_INGREDIENTS;
      }
    },
  });
}

export function usePizzas() {
  return useQuery({
    queryKey: ["pizzas"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("pizzas").select("*").order("price");
        if (error || !data || data.length === 0) return DEFAULT_PIZZAS;
        return data as Pizza[];
      } catch {
        return DEFAULT_PIZZAS;
      }
    },
  });
}

/* ---------- cart ---------- */

const getLocalCart = (): CartItem[] => {
  try {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("pizzahub_cart");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const setLocalCart = (items: CartItem[]) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("pizzahub_cart", JSON.stringify(items));
    }
  } catch {
    // ignore
  }
};

export function useCart(userId?: string) {
  return useQuery({
    queryKey: ["cart", userId],
    queryFn: async () => {
      return getLocalCart();
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
      const current = getLocalCart();
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...item,
      };
      setLocalCart([...current, newItem]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const current = getLocalCart();
      const updated = current
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      setLocalCart(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const current = getLocalCart();
      const updated = current.filter((i) => i.id !== id);
      setLocalCart(updated);
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
      try {
        const token = localStorage.getItem("pizzahub_token");
        const res = await fetch(`${API_BASE}/api/orders/user/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          return data.map((o: any) => ({
            id: o._id || o.id,
            user_id: o.user || userId,
            status: o.status,
            customer_name: o.customer_name,
            phone: o.phone,
            address: o.address,
            subtotal: o.subtotal,
            delivery_fee: o.delivery_fee,
            total: o.total,
            payment_id: o.payment_id,
            payment_status: o.payment_status,
            created_at: o.createdAt || new Date().toISOString(),
            updated_at: o.updatedAt || new Date().toISOString(),
            items: (o.items || []).map((it: any, idx: number) => ({
              id: it._id || `item-${idx}`,
              order_id: o._id || o.id,
              name: it.name,
              image_key: it.image_key || "custom",
              unit_price: it.unit_price,
              quantity: it.quantity,
              details: it.details || {},
            })),
          })) as Order[];
        }
      } catch {
        // ignore
      }

      // Check local storage
      try {
        const stored = JSON.parse(localStorage.getItem("pizzahub_orders") || "[]");
        return stored as Order[];
      } catch {
        return [];
      }
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
        if (res.ok) {
          const o = await res.json();
          const order: Order = {
            id: o._id || o.id,
            user_id: o.user || "",
            status: o.status,
            customer_name: o.customer_name,
            phone: o.phone,
            address: o.address,
            subtotal: o.subtotal,
            delivery_fee: o.delivery_fee,
            total: o.total,
            payment_id: o.payment_id,
            payment_status: o.payment_status,
            created_at: o.createdAt || new Date().toISOString(),
            updated_at: o.updatedAt || new Date().toISOString(),
          };
          const items: OrderItem[] = (o.items || []).map((it: any, idx: number) => ({
            id: it._id || `item-${idx}`,
            order_id: order.id,
            name: it.name,
            image_key: it.image_key || "custom",
            unit_price: it.unit_price,
            quantity: it.quantity,
            details: it.details || {},
          }));
          return { order, items };
        }
      } catch {
        // ignore
      }

      // Check local storage for public deployment fallback
      try {
        const stored = JSON.parse(localStorage.getItem("pizzahub_orders") || "[]");
        const found = stored.find((x: any) => x.id === orderId || x._id === orderId);
        if (found) {
          const items: OrderItem[] = (found.items || []).map((it: any, idx: number) => ({
            id: it._id || `item-${idx}`,
            order_id: found.id,
            name: it.name,
            image_key: it.image_key || "custom",
            unit_price: it.unit_price,
            quantity: it.quantity,
            details: it.details || {},
          }));
          return { order: found as Order, items };
        }
      } catch {
        // ignore
      }

      return { order: null, items: [] };
    },
  });
}

/* ---------- admin ---------- */

export function useAllOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-orders"],
    enabled,
    queryFn: async () => {
      try {
        const token = localStorage.getItem("pizzahub_token");
        const res = await fetch(`${API_BASE}/api/orders/admin/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          return data.map((o: any) => ({
            id: o._id || o.id,
            user_id: o.user || "",
            status: o.status,
            customer_name: o.customer_name,
            phone: o.phone,
            address: o.address,
            subtotal: o.subtotal,
            delivery_fee: o.delivery_fee,
            total: o.total,
            payment_id: o.payment_id,
            payment_status: o.payment_status,
            created_at: o.createdAt || new Date().toISOString(),
            updated_at: o.updatedAt || new Date().toISOString(),
            items: (o.items || []).map((it: any, idx: number) => ({
              id: it._id || `item-${idx}`,
              order_id: o._id || o.id,
              name: it.name,
              image_key: it.image_key || "custom",
              unit_price: it.unit_price,
              quantity: it.quantity,
              details: it.details || {},
            })),
          })) as Order[];
        }
      } catch {
        // ignore
      }
      return [];
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      try {
        const token = localStorage.getItem("pizzahub_token");
        const res = await fetch(`${API_BASE}/api/orders/admin/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) return;
      } catch {
        // fallback
      }
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
      delta_qty,
    }: {
      id: string;
      stock_qty?: number;
      low_stock_threshold?: number;
      delta_qty?: number;
    }) => {
      try {
        const token = localStorage.getItem("pizzahub_token");
        await fetch(`${API_BASE}/api/ingredients/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ stock_qty, low_stock_threshold, delta_qty }),
        });
      } catch {
        // ignore
      }
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
