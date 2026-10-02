import type { Product } from "@/types";

// Fallback catalogue used before Supabase is configured. Prices in NGN.
export const PRODUCTS: Product[] = [
  { id: "p-choc-chip", name: "Chocolate Chip Thin", slug: "chocolate-chip-thin", category: "cookies", price: 2500, image_url: "/products/chocolate-chip.svg", is_active: true, badge: "#1 TOP PICK", description: "Thin, crisp-edged and chewy in the middle, loaded with chocolate chips." },
  { id: "p-biscoff", name: "Biscoff Thin", slug: "biscoff-thin", category: "cookies", price: 2800, image_url: "/products/biscoff.svg", is_active: true, description: "A buttery thin cookie with caramelised Biscoff flavour." },
  { id: "p-white-choc", name: "White Chocolate Thin", slug: "white-chocolate-thin", category: "cookies", price: 2800, image_url: "/products/white-chocolate.svg", is_active: true, description: "A delicate thin cookie packed with creamy white chocolate." },
  { id: "p-oreo-cookie", name: "Oreo Thin", slug: "oreo-thin", category: "cookies", price: 2800, image_url: "/products/oreo-cookie.svg", is_active: true, description: "A chocolatey thin cookie loaded with Oreo pieces." },
  { id: "p-taro", name: "Taro Boba", slug: "taro-boba", category: "boba", price: 3500, image_url: "/products/taro-boba.svg", is_active: true, badge: "BEST SELLER", description: "Creamy taro milk tea with chewy boba pearls." },
  { id: "p-milk-tea", name: "Milk Tea Boba", slug: "milk-tea-boba", category: "boba", price: 3200, image_url: "/products/milk-tea.svg", is_active: true, description: "Classic creamy milk tea served with chewy boba pearls." },
  { id: "p-oreo-boba", name: "Oreo Boba", slug: "oreo-boba", category: "boba", price: 3800, image_url: "/products/oreo-boba.svg", is_active: true, badge: "NEW", description: "Sweet creamy milk tea blended with Oreo goodness and boba." },
  { id: "p-lychee", name: "Lychee Boba", slug: "lychee-boba", category: "boba", price: 3400, image_url: "/products/lychee-boba.svg", is_active: true, description: "Refreshing lychee tea with chewy boba pearls." },
];

export function formatNGN(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}
