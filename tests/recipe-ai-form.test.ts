import { describe, expect, it } from "vitest";
import { createIngredient } from "@/features/ingredients/data";
import { createKitchen } from "@/features/kitchens/data";
import { createRecipe, getRecipeDetail } from "@/features/recipes/data";
import { recipeInputFromFormData } from "@/features/recipes/form";
import { withTestDb } from "./helpers/test-db";

describe("AI recipe form input", () => {
  it("creates recipe input from AI ingredient names and steps", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "AI Kitchen" }, db);
      const formData = new FormData();

      formData.set("kitchenId", kitchen.id);
      formData.set("aiTitle", "크림 파스타");
      formData.set("aiDescription", "생크림으로 농도를 잡은 파스타");
      formData.set("aiMarkdownContent", "## 재료\n- 생크림 200ml\n\n## 조리 순서\n1. 끓인다.");
      formData.append("aiIngredientName", "생크림");
      formData.append("aiAmount", "200");
      formData.append("aiUnit", "ml");
      formData.append("aiNote", "차갑게 보관");
      formData.append("aiIngredientName", "소금");
      formData.append("aiAmount", "1");
      formData.append("aiUnit", "꼬집");
      formData.append("aiNote", "");
      formData.append("aiStepTitle", "면 삶기");
      formData.append("aiStepDescription", "소금을 넣은 물에 면을 삶는다.");
      formData.append("aiStepTitle", "소스 만들기");
      formData.append("aiStepDescription", "생크림을 넣고 약불에서 농도를 맞춘다.");

      const input = await recipeInputFromFormData(formData, null, db);
      const recipe = await createRecipe(input, db);
      const detail = await getRecipeDetail(recipe.id, db);

      expect(input.title).toBe("크림 파스타");
      expect(input.description).toBe("생크림으로 농도를 잡은 파스타");
      expect(input.markdownContent).toContain("## 재료");
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "생크림",
        "소금"
      ]);
      expect(detail?.steps.map((step) => step.title)).toEqual([
        "면 삶기",
        "소스 만들기"
      ]);
    });
  });

  it("matches existing ingredients and lets manual text override AI text", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Override Kitchen" }, db);
      const cream = await createIngredient({ kitchenId: kitchen.id, name: "생크림" }, db);
      const formData = new FormData();

      formData.set("kitchenId", kitchen.id);
      formData.set("title", "직접 입력한 제목");
      formData.set("aiTitle", "AI 제목");
      formData.set("markdownContent", "직접 입력한 본문");
      formData.set("aiMarkdownContent", "AI 본문");
      formData.append("aiIngredientName", "생크림");
      formData.append("aiAmount", "150");
      formData.append("aiUnit", "ml");
      formData.append("aiNote", "");

      const input = await recipeInputFromFormData(formData, null, db);
      const ingredientCount = await db.ingredient.count({
        where: { kitchenId: kitchen.id, name: "생크림" }
      });

      expect(input.title).toBe("직접 입력한 제목");
      expect(input.markdownContent).toBe("직접 입력한 본문");
      expect(input.ingredients?.[0]?.ingredientId).toBe(cream.id);
      expect(ingredientCount).toBe(1);
    });
  });

  it("ignores retired manual ingredient and step fields", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Retired Manual Kitchen" }, db);
      const salt = await createIngredient({ kitchenId: kitchen.id, name: "소금" }, db);
      const formData = new FormData();

      formData.set("kitchenId", kitchen.id);
      formData.set("title", "수동 필드 무시");
      formData.append("ingredientId", salt.id);
      formData.append("amount", "1");
      formData.append("unit", "꼬집");
      formData.append("stepTitle", "간 맞추기");
      formData.append("stepDescription", "소금을 넣는다.");

      const input = await recipeInputFromFormData(formData, null, db);

      expect(input.ingredients).toEqual([]);
      expect(input.steps).toEqual([]);
    });
  });

  it("summarizes raw recipe text when final submit happens before the AI preview button", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "One Button Kitchen" }, db);
      const formData = new FormData();

      formData.set("kitchenId", kitchen.id);
      formData.set(
        "rawRecipeText",
        "팬에 버터를 녹이고 양파를 볶다가 생크림을 넣어 졸인다."
      );

      const input = await recipeInputFromFormData(
        formData,
        null,
        db,
        async (rawText) => {
          expect(rawText).toContain("생크림");
          return {
            title: "크림 양파 소스",
            description: "생크림과 양파로 만드는 간단한 소스",
            markdownContent:
              "# 크림 양파 소스\n\n## 재료\n- 생크림 200ml\n- 양파 1개\n\n## 조리 순서\n1. 양파를 볶는다.",
            ingredients: [
              {
                name: "생크림",
                amount: "200",
                unit: "ml",
                note: ""
              },
              {
                name: "양파",
                amount: "1",
                unit: "개",
                note: ""
              }
            ],
            steps: [
              {
                title: "소스 만들기",
                description: "양파를 볶다가 생크림을 넣어 졸인다."
              }
            ]
          };
        }
      );
      const recipe = await createRecipe(input, db);
      const detail = await getRecipeDetail(recipe.id, db);

      expect(input.title).toBe("크림 양파 소스");
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "생크림",
        "양파"
      ]);
      expect(detail?.steps.map((step) => step.title)).toEqual(["소스 만들기"]);
    });
  });

  it("ignores stale AI fields when the raw recipe text changed after analysis", async () => {
    await withTestDb(async (db) => {
      const kitchen = await createKitchen({ name: "Stale AI Kitchen" }, db);
      const formData = new FormData();

      formData.set("kitchenId", kitchen.id);
      formData.set("rawRecipeText", "토마토를 으깨고 바질을 넣어 소스를 만든다.");
      formData.set("aiSourceText", "생크림을 넣고 크림 소스를 만든다.");
      formData.set("title", "크림 소스");
      formData.set("aiTitle", "크림 소스");
      formData.set("markdownContent", "# 크림 소스\n\n## 재료\n- 생크림");
      formData.set("aiMarkdownContent", "# 크림 소스\n\n## 재료\n- 생크림");
      formData.append("aiIngredientName", "생크림");
      formData.append("aiAmount", "200");
      formData.append("aiUnit", "ml");
      formData.append("aiNote", "");

      const input = await recipeInputFromFormData(
        formData,
        null,
        db,
        async (rawText) => {
          expect(rawText).toContain("토마토");
          return {
            title: "토마토 바질 소스",
            description: "토마토와 바질로 만드는 소스",
            markdownContent:
              "# 토마토 바질 소스\n\n## 재료\n- 토마토 2개\n- 바질 약간",
            ingredients: [
              {
                name: "토마토",
                amount: "2",
                unit: "개",
                note: ""
              },
              {
                name: "바질",
                amount: "",
                unit: "약간",
                note: ""
              }
            ],
            steps: [
              {
                title: "소스 만들기",
                description: "토마토를 으깨고 바질을 넣는다."
              }
            ]
          };
        }
      );
      const recipe = await createRecipe(input, db);
      const detail = await getRecipeDetail(recipe.id, db);

      expect(input.title).toBe("토마토 바질 소스");
      expect(input.markdownContent).toContain("토마토");
      expect(detail?.recipeIngredients.map((item) => item.ingredient.name)).toEqual([
        "토마토",
        "바질"
      ]);
    });
  });
});
