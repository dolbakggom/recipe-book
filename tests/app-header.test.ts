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
  });

  it("hides navigation on retired ingredient routes", () => {
    expect(shouldShowAppNavigation("/ingredients")).toBe(false);
    expect(shouldShowAppNavigation("/ingredients/abc")).toBe(false);
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
