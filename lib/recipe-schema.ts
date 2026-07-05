import { z } from "zod";

// AI 응답에 강제하는 레시피 JSON 스키마 (zod: 서버측 파싱/검증용)
export const RecipeResponseSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  servings: z.number().int().positive(),
  totalCalories: z.number().nonnegative(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.number().nonnegative(),
        unit: z.string(),
        calories: z.number().nonnegative(),
      })
    )
    .min(1),
  steps: z.array(z.string().min(1)).min(1),
  usedTools: z.array(z.string()),
  missingIngredients: z.array(z.string()),
});

export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;

// Anthropic structured outputs(output_config.format)에 전달하는 JSON Schema
export const RECIPE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "레시피 이름 (한국어)" },
    description: { type: "string", description: "레시피 한두 문장 소개" },
    servings: { type: "integer", description: "인분 수" },
    totalCalories: {
      type: "number",
      description: "재료별 칼로리의 정확한 합계 (kcal)",
    },
    ingredients: {
      type: "array",
      description: "재료 목록. calories 합계는 totalCalories와 일치해야 함",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
          unit: { type: "string", description: "g, ml, 개, 큰술 등" },
          calories: { type: "number", description: "이 재료 분량의 kcal" },
        },
        required: ["name", "amount", "unit", "calories"],
        additionalProperties: false,
      },
    },
    steps: {
      type: "array",
      description: "조리 단계 (순서대로)",
      items: { type: "string" },
    },
    usedTools: {
      type: "array",
      description: "이 레시피에 사용된 조리 도구",
      items: { type: "string" },
    },
    missingIngredients: {
      type: "array",
      description: "사용자 팬트리에 없어 구매가 필요한 재료명",
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "description",
    "servings",
    "totalCalories",
    "ingredients",
    "steps",
    "usedTools",
    "missingIngredients",
  ],
  additionalProperties: false,
} as const;
