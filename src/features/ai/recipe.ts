export type AiRecipeIngredient = {
  name: string;
  amount: string;
  unit: string;
  note: string;
};

export type AiRecipeStep = {
  title: string;
  description: string;
};

export type AiRecipeSuggestion = {
  title: string;
  description: string;
  ingredients: AiRecipeIngredient[];
  steps: AiRecipeStep[];
  markdownContent: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const recipeResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          amount: { type: "STRING" },
          unit: { type: "STRING" },
          note: { type: "STRING" }
        },
        required: ["name", "amount", "unit", "note"]
      }
    },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" }
        },
        required: ["title", "description"]
      }
    },
    markdownContent: { type: "STRING" }
  },
  required: ["title", "description", "ingredients", "steps", "markdownContent"]
};

export async function analyzeRecipeDraft(rawText: string) {
  return generateRecipeSuggestion(rawText, "extract");
}

export async function summarizeRecipeDraft(rawText: string) {
  return generateRecipeSuggestion(rawText, "summarize");
}

async function generateRecipeSuggestion(
  rawText: string,
  mode: "extract" | "summarize"
): Promise<AiRecipeSuggestion> {
  const text = rawText.trim();

  if (text.length < 10) {
    throw new Error("레시피 내용을 조금 더 입력해 주세요.");
  }

  const response = await callGeminiJson(buildPrompt(text, mode));
  return normalizeSuggestion(response);
}

async function callGeminiJson(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: recipeResponseSchema
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini 요청에 실패했습니다. (${response.status})`);
  }

  const body = (await response.json()) as GeminiResponse;
  const text = body.candidates?.[0]?.content?.parts?.find((part) => part.text)
    ?.text;

  if (!text) {
    throw new Error("Gemini 응답에서 레시피 결과를 찾지 못했습니다.");
  }

  return JSON.parse(stripJsonFence(text)) as unknown;
}

function buildPrompt(rawText: string, mode: "extract" | "summarize") {
  const task =
    mode === "extract"
      ? "사용자가 자유롭게 작성한 레시피에서 재료와 조리 순서를 정확히 추출하세요."
      : "사용자가 자유롭게 작성한 레시피를 재료, 조리 순서, 조리 팁이 보이는 깔끔한 마크다운 레시피로 요약하세요.";

  return `
당신은 한국어 레시피를 정리하는 요리 보조 AI입니다.

작업:
${task}

규칙:
- 사용자가 쓴 내용에 근거해서만 추출하고, 확실하지 않은 수량은 빈 문자열로 둡니다.
- 재료명은 "생크림", "닭다리살", "소금"처럼 짧고 재사용 가능한 식재료명으로 정리합니다.
- 조리 순서는 실제 요리 순서대로 정렬합니다.
- markdownContent는 아래 레이아웃을 지켜 한국어 Markdown으로 작성합니다.

Markdown 레이아웃:
# 레시피명

## 한 줄 소개
짧은 설명

## 재료
- 재료명 수량단위 (선택 메모)

## 조리 순서
1. 단계 설명

## 조리 팁
- 팁

반드시 JSON만 반환하세요.

사용자 레시피:
${rawText}
`.trim();
}

function normalizeSuggestion(value: unknown): AiRecipeSuggestion {
  const record = isRecord(value) ? value : {};

  return {
    title: cleanString(record.title),
    description: cleanString(record.description),
    ingredients: asArray(record.ingredients)
      .map((ingredient) => normalizeIngredient(ingredient))
      .filter((ingredient) => ingredient.name)
      .slice(0, 30),
    steps: asArray(record.steps)
      .map((step) => normalizeStep(step))
      .filter((step) => step.title || step.description)
      .slice(0, 20),
    markdownContent: cleanString(record.markdownContent)
  };
}

function normalizeIngredient(value: unknown): AiRecipeIngredient {
  const record = isRecord(value) ? value : {};

  return {
    name: cleanString(record.name),
    amount: cleanString(record.amount),
    unit: cleanString(record.unit),
    note: cleanString(record.note)
  };
}

function normalizeStep(value: unknown): AiRecipeStep {
  const record = isRecord(value) ? value : {};

  return {
    title: cleanString(record.title),
    description: cleanString(record.description)
  };
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
