/** Formats a number as Indian Rupees. */
export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const DELIVERY_FEE = 49;

/** Base labour/oven charge applied to every custom pizza. */
export const CUSTOM_BASE_FEE = 99;

export const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ORDER_FLOW = [
  "Order Received",
  "In Kitchen",
  "Sent to Delivery",
  "Delivered",
] as const;

export type OrderStatus = (typeof ORDER_FLOW)[number] | "Cancelled";
