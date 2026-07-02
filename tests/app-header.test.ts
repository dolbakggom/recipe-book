import { describe, expect, it } from "vitest";
import {
  APP_NAVIGATION_ITEMS,
  shouldShowAppNavigation
} from "@/components/AppHeader";

describe("app header navigation visibility", () => {
  it("hides navigation on shared routes", () => {
    expect(shouldShowAppNavigation("/shared")).toBe(false);
    expect(shouldShowAppNavigation("/shared/abc")).toBe(false);
  });

  it("shows navigation on normal app routes", () => {
    expect(shouldShowAppNavigation("/kitchens")).toBe(true);
    expect(shouldShowAppNavigation("/ingredients")).toBe(true);
  });

  it("keeps top-level navigation minimal and Korean", () => {
    expect(APP_NAVIGATION_ITEMS).toEqual([
      {
        href: "/kitchens",
        label: "주방"
      }
    ]);
  });
});
