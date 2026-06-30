import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Book",
  description: "Local recipe book for Kitchens, Recipes, and Ingredient blocks"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="app-header">
          <Link href="/kitchens" className="brand">
            Recipe Book
          </Link>
          <nav className="top-nav" aria-label="Primary navigation">
            <Link href="/kitchens">Kitchens</Link>
            <Link href="/ingredients">Ingredients</Link>
          </nav>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
