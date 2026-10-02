export type Category = "cookies" | "boba";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: Category;
  price: number; // NGN kobo-free naira amount
  image_url: string;
  is_active: boolean;
  badge?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartOption {
  label: string; // e.g. "Size"
  value: string; // e.g. "Large"
  priceDelta?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  options?: CartOption[];
  lineKey: string;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  options?: CartOption[];
}

export interface CheckoutForm {
  customer_name: string;
  email: string;
  phone: string;
  fulfilment_method: "pickup" | "delivery";
  delivery_address: string;
  notes: string;
}

export interface OrderSummary {
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  fulfilment_method: string;
  email: string;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
}
