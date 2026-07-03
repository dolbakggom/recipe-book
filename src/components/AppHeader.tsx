"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const APP_NAVIGATION_ITEMS = [
  {
    href: "/kitchens",
    label: "주방"
  }
];

export function shouldShowAppNavigation(pathname: string) {
  return (
    pathname !== "/shared" &&
    !pathname.startsWith("/shared/") &&
    pathname !== "/ingredients" &&
    !pathname.startsWith("/ingredients/")
  );
}

export function AppHeader() {
  const pathname = usePathname();

  if (!shouldShowAppNavigation(pathname)) {
    return null;
  }

  const isKitchensActive = pathname === "/" || pathname.startsWith("/kitchens");

  return (
    <header className="app-header">
      <Link href="/kitchens" className="brand">
        레시피북
      </Link>
      <nav className="top-nav" aria-label="주요 탐색">
        {APP_NAVIGATION_ITEMS.map((item) => (
          <Link
            href={item.href}
            className={isKitchensActive ? "active" : ""}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
