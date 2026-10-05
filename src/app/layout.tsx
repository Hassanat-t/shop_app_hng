import type { Metadata } from "next";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";

const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });
const sans = Nunito_Sans({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tt's pink oven | Thin Cookies & Boba",
  description: "Freshly baked thin cookies and delicious boba made with love.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--light-pink)] font-sans antialiased">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

