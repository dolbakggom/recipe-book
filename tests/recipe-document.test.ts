import { describe, expect, it } from "vitest";
import { ingredientSummariesFromRecipe } from "@/features/recipes/document";

describe("recipe document helpers", () => {
  it("uses connected recipe ingredients before markdown fallback", () => {
    expect(
      ingredientSummariesFromRecipe({
        markdownContent: "## 재료\n- 생크림 200ml\n- 소금 1꼬집",
        recipeIngredients: [
          {
            amount: "150",
            unit: "ml",
            note: "차갑게",
            ingredient: {
              name: "생크림"
            }
          }
        ]
      })
    ).toEqual([
      {
        key: "ingredient-0-생크림",
        name: "생크림",
        amountText: "150 ml",
        note: "차갑게"
      }
    ]);
  });

  it("extracts ingredients from the recipe document when no links exist", () => {
    expect(
      ingredientSummariesFromRecipe({
        markdownContent: [
          "# 크림 파스타",
          "",
          "## 재료",
          "- 생크림 200ml",
          "- 양파 1/2개",
          "- 소금 1꼬집 (간 맞추기)",
          "",
          "## 조리 순서",
          "1. 양파를 볶는다."
        ].join("\n"),
        recipeIngredients: []
      })
    ).toEqual([
      {
        key: "markdown-0-생크림 200ml",
        name: "생크림 200ml",
        amountText: "",
        note: ""
      },
      {
        key: "markdown-1-양파 1/2개",
        name: "양파 1/2개",
        amountText: "",
        note: ""
      },
      {
        key: "markdown-2-소금 1꼬집 (간 맞추기)",
        name: "소금 1꼬집 (간 맞추기)",
        amountText: "",
        note: ""
      }
    ]);
  });
});
