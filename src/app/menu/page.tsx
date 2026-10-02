import { getProducts } from "@/lib/products";
import MenuGrid from "./MenuGrid";
export const metadata = { title: "The Menu | tt's pink oven" };
// Always render fresh from Supabase — never a stale static page.
export const dynamic = "force-dynamic";
export default async function MenuPage() {
  const products = await getProducts();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="font-serif-d text-4xl font-bold text-[var(--wine)]">THE MENU</h1>
      <p className="text-[#7a5a5a]">Something sweet for every mood.</p>
      <MenuGrid products={products} />
    </div>
  );
}
