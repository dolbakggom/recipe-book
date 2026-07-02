"use server";

import type { AiRecipeSuggestion } from "./recipe";
import { analyzeRecipeDraft, summarizeRecipeDraft } from "./recipe";

export type AiRecipeActionResult =
  | {
      ok: true;
      recipe: AiRecipeSuggestion;
    }
  | {
      ok: false;
      error: string;
    };

export async function analyzeRecipeDraftAction(
  rawText: string
): Promise<AiRecipeActionResult> {
  return runAiRecipeAction(() => analyzeRecipeDraft(rawText));
}

export async function summarizeRecipeDraftAction(
  rawText: string
): Promise<AiRecipeActionResult> {
  return runAiRecipeAction(() => summarizeRecipeDraft(rawText));
}

async function runAiRecipeAction(
  action: () => Promise<AiRecipeSuggestion>
): Promise<AiRecipeActionResult> {
  try {
    const recipe = await action();
    return { ok: true, recipe };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI 요청에 실패했습니다."
    };
  }
}
