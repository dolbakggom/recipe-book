import { expect, test } from "@playwright/test";

test("core local MVP flow", async ({ page }, testInfo) => {
  const runId = `${testInfo.project.name}-${Date.now()}`;
  const kitchenName = `Smoke Kitchen ${runId}`;
  const recipeName = `Smoke Recipe ${runId}`;

  await page.goto("/kitchens");

  await page.getByLabel("Kitchen 이름").fill(kitchenName);
  await page.getByLabel("설명").fill("Smoke test recipe archive");
  await page.getByRole("button", { name: "Kitchen 생성" }).click();

  await expect(page.getByRole("heading", { name: kitchenName })).toBeVisible();
  await page.getByRole("link", { name: /New Recipe/ }).click();

  await page.getByLabel("레시피 이름").fill(recipeName);
  await page.getByLabel("간단 설명").fill("Smoke recipe description");
  await page.getByLabel("Markdown Notes").fill("## Smoke\n- Works");
  await page.getByRole("button", { name: "Create Recipe" }).click();

  await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();
  await expect(
    page.locator(".page-header .muted", { hasText: "Smoke recipe description" })
  ).toBeVisible();
});
