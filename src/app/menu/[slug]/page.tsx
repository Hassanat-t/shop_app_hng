import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/products";
import ProductView from "./ProductView";
// Product prices/details must always be fresh — no static pre-rendering.
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return { title: p ? `${p.name} | tt's pink oven` : "Product" };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const all = await getProducts();
  const related = all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  return <ProductView product={product} related={related} />;
}
