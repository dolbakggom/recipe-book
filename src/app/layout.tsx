import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "레시피북",
  description: "주방별 레시피를 작성하고 공유하는 공간"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <body>
        <AppHeader />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
