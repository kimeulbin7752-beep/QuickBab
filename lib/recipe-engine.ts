// AI 레시피 생성 엔진
//
// - Anthropic API에 사용자의 식이 프로필/팬트리/키친/목표 칼로리를 구조화해 주입
// - structured outputs(JSON Schema)로 응답 형식 강제
// - 응답을 절대 그대로 신뢰하지 않는다:
//   1) 알러지 재료 포함 여부 서버측 2차 검증 (lib/allergen.ts)
//   2) 칼로리 합산이 목표 ±5% 이내인지 검증 (lib/calorie.ts)
// - 검증 실패 시 실패 사유를 피드백으로 넣어 자동 재시도 (최대 2회)

import Anthropic from "@anthropic-ai/sdk";
import { findAllergenViolations } from "@/lib/allergen";
import { validateCalories } from "@/lib/calorie";
import {
  RECIPE_JSON_SCHEMA,
  RecipeResponseSchema,
  type RecipeResponse,
} from "@/lib/recipe-schema";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_RETRIES = 2;

export interface GenerateRecipeInput {
  targetCalories?: number;
  servings?: number;
  request?: string; // 자유 요청 (예: "매운 국물 요리")
  profile: {
    allergies: string[];
    religiousRestrictions: string[];
    healthConditions: string[];
  };
  pantry: string[];
  kitchenTools: string[];
  pantryMode: boolean; // 보유 재료 위주로 생성
  kitchenMode: boolean; // 등록된 도구만 사용
}

export interface GenerateRecipeResult {
  recipe: RecipeResponse;
  computedTotalCalories: number;
  attempts: number;
}

function buildSystemPrompt(input: GenerateRecipeInput): string {
  const { profile, pantry, kitchenTools, pantryMode, kitchenMode } = input;

  const sections: string[] = [
    "당신은 개인 맞춤 레시피를 설계하는 전문 영양사이자 셰프입니다.",
    "사용자의 제약 조건을 반드시 지켜서 실제로 조리 가능한 레시피 1개를 JSON으로 생성합니다.",
    "",
    "## 절대 규칙",
  ];

  if (profile.allergies.length > 0) {
    sections.push(
      `- [알러지 — 생명과 직결] 다음 재료와 그 파생물(소스·가루·육수 포함)을 절대 사용 금지: ${profile.allergies.join(", ")}`
    );
  }
  if (profile.religiousRestrictions.length > 0) {
    sections.push(
      `- [종교/신념 제한] 다음 식이 규칙을 반드시 준수: ${profile.religiousRestrictions.join(", ")}`
    );
  }
  if (profile.healthConditions.length > 0) {
    sections.push(
      `- [건강 조건] 다음 조건에 적합하게 설계(나트륨/당류/지방 등 조절): ${profile.healthConditions.join(", ")}`
    );
  }

  if (input.targetCalories) {
    sections.push(
      "",
      "## 칼로리 정밀 매칭 (핵심)",
      `- 목표 칼로리: ${input.targetCalories}kcal (허용 오차 ±5%, 즉 ${Math.round(input.targetCalories * 0.95)}~${Math.round(input.targetCalories * 1.05)}kcal)`,
      "- 단순히 비슷한 레시피를 고르지 말고, 재료의 양(g/ml)을 조절해 목표치에 수렴시키는 역설계 방식으로 작성",
      "- 각 재료의 calories는 해당 분량 기준의 실제 kcal이어야 하며, ingredients의 calories 합계가 totalCalories와 정확히 일치해야 함",
      "- 작성 후 반드시 합계를 다시 계산해 오차 범위를 벗어나면 재료 양을 조정할 것"
    );
  }

  if (pantry.length > 0) {
    sections.push(
      "",
      "## 팬트리 (사용자 보유 재료)",
      `- 보유: ${pantry.join(", ")}`,
      pantryMode
        ? "- [팬트리 모드 ON] 보유 재료를 최대한 활용해 구성하고, 부족한 재료는 최소화하여 missingIngredients에 나열"
        : "- 보유 재료를 참고하되 자유롭게 구성 가능. 보유하지 않은 재료는 missingIngredients에 나열"
    );
  } else {
    sections.push(
      "",
      "- 사용자 팬트리가 비어 있으므로 모든 재료를 missingIngredients에 나열"
    );
  }

  if (kitchenTools.length > 0 && kitchenMode) {
    sections.push(
      "",
      "## 키친 (조리 도구 제한)",
      `- [키친 모드 ON] 다음 도구만으로 완성 가능해야 함: ${kitchenTools.join(", ")}`,
      "- 위 목록에 없는 도구(예: 오븐이 없으면 오븐 요리 금지)는 조리 단계에 등장하면 안 됨",
      "- usedTools에는 실제 사용한 도구만 기재"
    );
  } else if (kitchenTools.length > 0) {
    sections.push("", `## 키친 (참고용 보유 도구): ${kitchenTools.join(", ")}`);
  }

  sections.push(
    "",
    "## 출력",
    "- 모든 텍스트는 한국어로 작성",
    "- steps는 초보자도 따라할 수 있게 구체적으로 (불 세기, 시간 포함)"
  );

  return sections.join("\n");
}

function buildUserPrompt(input: GenerateRecipeInput, feedback?: string): string {
  const parts: string[] = [];
  const servings = input.servings ?? 1;
  parts.push(`${servings}인분 레시피를 만들어주세요.`);
  if (input.targetCalories) {
    parts.push(`목표 칼로리는 총 ${input.targetCalories}kcal입니다.`);
  }
  if (input.request?.trim()) {
    parts.push(`요청 사항: ${input.request.trim()}`);
  }
  if (feedback) {
    parts.push(
      "",
      `[이전 시도 실패 — 반드시 수정할 것] ${feedback}`,
      "재료 구성 또는 양을 조정하여 위 문제를 해결한 새 레시피를 생성하세요."
    );
  }
  return parts.join("\n");
}

/** 서버측 안전/정합성 검증. 실패 시 재시도 프롬프트에 쓸 사유를 반환. */
export function validateRecipe(
  recipe: RecipeResponse,
  input: Pick<GenerateRecipeInput, "targetCalories" | "profile">
): { ok: boolean; computedTotal: number; reason?: string } {
  // 1) 알러지 안전 체크 (최우선)
  const violations = findAllergenViolations(
    recipe.ingredients,
    input.profile.allergies
  );
  if (violations.length > 0) {
    const detail = violations
      .map((v) => `'${v.ingredient}'(알러지: ${v.allergy})`)
      .join(", ");
    return {
      ok: false,
      computedTotal: 0,
      reason: `알러지 유발 재료가 포함됨: ${detail}. 해당 재료를 완전히 제거하고 대체 재료를 사용할 것`,
    };
  }

  // 2) 칼로리 정합성 + 목표 오차 검증
  return validateCalories(
    recipe.ingredients,
    recipe.totalCalories,
    input.targetCalories
  );
}

export async function generateRecipe(
  input: GenerateRecipeInput
): Promise<GenerateRecipeResult> {
  const client = new Anthropic();
  const system = buildSystemPrompt(input);

  let feedback: string | undefined;
  let lastError = "레시피 생성에 실패했습니다";

  for (let attempt = 1; attempt <= 1 + MAX_RETRIES; attempt++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: buildUserPrompt(input, feedback) }],
      output_config: {
        format: {
          type: "json_schema",
          schema: RECIPE_JSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("AI가 이 요청에 대한 레시피 생성을 거부했습니다.");
    }

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) {
      lastError = "AI 응답에서 텍스트를 찾을 수 없습니다";
      feedback = "유효한 JSON 레시피를 생성하지 못함";
      continue;
    }

    let recipe: RecipeResponse;
    try {
      recipe = RecipeResponseSchema.parse(JSON.parse(text));
    } catch {
      lastError = "AI 응답이 레시피 스키마와 일치하지 않습니다";
      feedback = "응답 JSON이 스키마와 일치하지 않음. 스키마를 정확히 따를 것";
      continue;
    }

    const validation = validateRecipe(recipe, input);
    if (validation.ok) {
      return {
        recipe: { ...recipe, totalCalories: validation.computedTotal },
        computedTotalCalories: validation.computedTotal,
        attempts: attempt,
      };
    }

    lastError = validation.reason ?? "검증 실패";
    feedback = validation.reason;
  }

  throw new Error(`레시피 검증 실패 (${1 + MAX_RETRIES}회 시도): ${lastError}`);
}
