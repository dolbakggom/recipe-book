import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Book",
  description: "Local recipe book for Kitchens, Recipes, and Ingredient blocks"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppHeader />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
