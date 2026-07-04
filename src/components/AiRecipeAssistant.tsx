"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import type { AiRecipeSuggestion } from "@/features/ai/recipe";
import { summarizeRecipeDraftAction } from "@/features/ai/actions";
import { recipeDraftFingerprint } from "@/features/recipes/source-fingerprint";

export function AiRecipeAssistant({
  initialDraft = ""
}: {
  initialDraft?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [suggestion, setSuggestion] = useState<AiRecipeSuggestion | null>(null);
  const [suggestionSourceFingerprint, setSuggestionSourceFingerprint] =
    useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function runAi() {
    setError("");
    const sourceText = draft;

    startTransition(async () => {
      const result = await summarizeRecipeDraftAction(sourceText);

      if (result.ok) {
        applySuggestionToForm(result.recipe);
        setSuggestion(result.recipe);
        setSuggestionSourceFingerprint(recipeDraftFingerprint(sourceText));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="ai-assistant">
      <div className="ai-assistant-header">
        <div>
          <p className="eyebrow">레시피 작성</p>
          <h3>내용을 쓰면 재료와 조리법을 정리합니다</h3>
        </div>
      </div>

      <div className="field">
        <label htmlFor="rawRecipeText">자유 레시피 본문</label>
        <textarea
          className="textarea ai-draft-textarea"
          id="rawRecipeText"
          name="rawRecipeText"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="예: 팬에 버터를 녹이고 양파를 볶다가 생크림을 넣고 약불로 졸여요. 삶은 파스타면을 넣고 소금, 후추로 간을 맞춥니다."
          value={draft}
        />
      </div>

      <div className="button-row">
        <button
          className="button"
          disabled={isPending}
          onClick={runAi}
          type="button"
        >
          <Sparkles size={18} aria-hidden="true" />
          {isPending ? "분석 중..." : "인공지능으로 분석하기"}
        </button>
      </div>

      {error && <p className="ai-error">{error}</p>}

      {suggestion && (
        <div className="ai-result">
          <AiResultHiddenFields
            sourceFingerprint={suggestionSourceFingerprint}
            suggestion={suggestion}
          />
          <div className="ai-result-summary">
            <div>
              <span className="muted">제목</span>
              <strong>{suggestion.title || "제목 없음"}</strong>
            </div>
            <div>
              <span className="muted">재료</span>
              <strong>{suggestion.ingredients.length}개</strong>
            </div>
            <div>
              <span className="muted">조리 단계</span>
              <strong>{suggestion.steps.length}단계</strong>
            </div>
          </div>

          <div className="ai-result-grid">
            <section>
              <h4>인식된 재료</h4>
              {suggestion.ingredients.length === 0 ? (
                <p className="muted">인식된 재료가 없습니다.</p>
              ) : (
                <div className="tag-row">
                  {suggestion.ingredients.map((ingredient, index) => (
                    <span className="tag" key={`${ingredient.name}-${index}`}>
                      {[ingredient.name, ingredient.amount, ingredient.unit]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4>인식된 조리 순서</h4>
              {suggestion.steps.length === 0 ? (
                <p className="muted">인식된 단계가 없습니다.</p>
              ) : (
                <ol className="ai-step-preview">
                  {suggestion.steps.map((step, index) => (
                    <li key={`${step.title}-${index}`}>
                      <strong>{step.title || `단계 ${index + 1}`}</strong>
                      {step.description && <p>{step.description}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {suggestion.markdownContent && (
            <details className="ai-markdown-preview">
              <summary>정리된 문서 보기</summary>
              <pre>{suggestion.markdownContent}</pre>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function applySuggestionToForm(suggestion: AiRecipeSuggestion) {
  setFormFieldValue("title", suggestion.title);
  setFormFieldValue("description", suggestion.description);
  setFormFieldValue("markdownContent", suggestion.markdownContent);
}

function setFormFieldValue(id: string, value: string) {
  if (!value.trim()) {
    return;
  }

  const field = document.getElementById(id);

  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function AiResultHiddenFields({
  sourceFingerprint,
  suggestion
}: {
  sourceFingerprint: string;
  suggestion: AiRecipeSuggestion;
}) {
  return (
    <>
      <input name="aiResultActive" type="hidden" value="1" />
      <input
        name="aiSourceFingerprint"
        type="hidden"
        value={sourceFingerprint}
      />
      <input name="aiTitle" type="hidden" value={suggestion.title} />
      <input name="aiDescription" type="hidden" value={suggestion.description} />
      <input
        name="aiMarkdownFingerprint"
        type="hidden"
        value={recipeDraftFingerprint(suggestion.markdownContent)}
      />
      {suggestion.ingredients.map((ingredient, index) => (
        <span aria-hidden="true" key={`${ingredient.name}-${index}`}>
          <input name="aiIngredientName" type="hidden" value={ingredient.name} />
          <input name="aiAmount" type="hidden" value={ingredient.amount} />
          <input name="aiUnit" type="hidden" value={ingredient.unit} />
          <input name="aiNote" type="hidden" value={ingredient.note} />
        </span>
      ))}
      {suggestion.steps.map((step, index) => (
        <span aria-hidden="true" key={`${step.title}-${index}`}>
          <input name="aiStepTitle" type="hidden" value={step.title} />
          <input
            name="aiStepDescription"
            type="hidden"
            value={step.description}
          />
        </span>
      ))}
    </>
  );
}
