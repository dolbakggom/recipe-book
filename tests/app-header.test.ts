import { describe, expect, it } from "vitest";
import { shouldShowAppNavigation } from "@/components/AppHeader";

describe("app header navigation visibility", () => {
  it("hides navigation on shared routes", () => {
    expect(shouldShowAppNavigation("/shared")).toBe(false);
    expect(shouldShowAppNavigation("/shared/abc")).toBe(false);
  });

  it("shows navigation on normal app routes", () => {
    expect(shouldShowAppNavigation("/kitchens")).toBe(true);
    expect(shouldShowAppNavigation("/ingredients")).toBe(true);
  });
});
