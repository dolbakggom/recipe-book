"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function shouldShowAppNavigation(pathname: string) {
  return pathname !== "/shared" && !pathname.startsWith("/shared/");
}

export function AppHeader() {
  const pathname = usePathname();

  if (!shouldShowAppNavigation(pathname)) {
    return null;
  }

  return (
    <header className="app-header">
      <Link href="/kitchens" className="brand">
        Recipe Book
      </Link>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/kitchens">Kitchens</Link>
        <Link href="/ingredients">Ingredients</Link>
      </nav>
    </header>
  );
}
