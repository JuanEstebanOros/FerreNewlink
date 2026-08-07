export type Currency = "USD" | "VES";

export type CartItem = {
  productId: string;
  name: string;
  priceUsd: number;
  qty: number;
  imageUrl: string | null;
  stock: number;
};

export type OrderStatus = "pending" | "completed" | "cancelled";
