import { expect, test } from "@playwright/test";
import { prisma } from "@/lib/db";

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("core local MVP flow", async ({ page }, testInfo) => {
  const runId = `${testInfo.project.name}-${Date.now()}`;
  const kitchenName = `스모크 주방 ${runId}`;
  const recipeName = `스모크 레시피 ${runId}`;

  try {
    await page.goto("/kitchens");

    await expect(page.getByRole("link", { name: "식재료" })).toHaveCount(0);
    await page.getByLabel("주방 이름").fill(kitchenName);
    await page.getByLabel("설명").fill("스모크 테스트 레시피 공간");
    await page.getByRole("button", { name: "주방 만들기" }).click();

    await expect(page.getByRole("heading", { name: kitchenName })).toBeVisible();
    await expect(page.getByRole("link", { name: /새 레시피/ })).toHaveCount(1);
    await page.getByRole("link", { name: /새 레시피/ }).click();

    await expect(page.getByRole("button", { name: "레시피 문서 만들기" })).toBeVisible();
    await expect(page.getByRole("button", { name: /인공지능으로 분석/ })).toHaveCount(1);
    await expect(page.getByText(/Ingredient Blocks|Steps|Markdown Notes|Gemini|Recipe|Kitchen/)).toHaveCount(0);
    await page.getByLabel("레시피 이름").fill(recipeName);
    await page.getByLabel("간단 설명").fill("스모크 레시피 설명");
    await page.getByLabel("레시피 문서").fill("## 스모크\n- 작동합니다");
    await page.getByRole("button", { name: "레시피 문서 만들기" }).click();

    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();
    await expect(
      page.locator(".page-header .muted", { hasText: "스모크 레시피 설명" })
    ).toBeVisible();
  } finally {
    await prisma.kitchen.deleteMany({ where: { name: kitchenName } });
  }
});
