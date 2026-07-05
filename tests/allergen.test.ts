import { describe, expect, it } from "vitest";
import { findAllergenViolations, keywordsForAllergy } from "@/lib/allergen";
import { validateRecipe } from "@/lib/recipe-engine";
import type { RecipeResponse } from "@/lib/recipe-schema";

describe("keywordsForAllergy", () => {
  it("사전에 등록된 알러지는 동의어를 포함한다", () => {
    const keywords = keywordsForAllergy("땅콩");
    expect(keywords).toContain("땅콩");
    expect(keywords).toContain("피넛");
    expect(keywords).toContain("peanut");
  });

  it("사전에 없는 알러지는 이름 자체를 키워드로 사용한다", () => {
    expect(keywordsForAllergy("키위")).toContain("키위");
  });
});

describe("findAllergenViolations — AI 응답 2차 안전 검증", () => {
  it("알러지 재료가 그대로 포함된 경우를 감지한다", () => {
    const violations = findAllergenViolations(
      [{ name: "땅콩" }, { name: "현미밥" }],
      ["땅콩"]
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].ingredient).toBe("땅콩");
  });

  it("파생 재료(부분 문자열)도 감지한다", () => {
    const violations = findAllergenViolations(
      [{ name: "땅콩버터 소스" }],
      ["땅콩"]
    );
    expect(violations).toHaveLength(1);
  });

  it("동의어 재료(피넛/peanut)도 감지한다", () => {
    expect(findAllergenViolations([{ name: "피넛소스" }], ["땅콩"])).toHaveLength(1);
    expect(
      findAllergenViolations([{ name: "Peanut Butter" }], ["땅콩"])
    ).toHaveLength(1);
  });

  it("갑각류 알러지 → 새우/게 파생 재료를 감지한다", () => {
    const violations = findAllergenViolations(
      [{ name: "냉동 새우" }, { name: "게맛살" }],
      ["갑각류"]
    );
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it("유제품 알러지 → 치즈/버터를 감지한다", () => {
    const violations = findAllergenViolations(
      [{ name: "체다치즈" }, { name: "무염버터" }],
      ["우유(유제품)"]
    );
    expect(violations).toHaveLength(2);
  });

  it("대소문자와 공백을 무시하고 감지한다", () => {
    expect(
      findAllergenViolations([{ name: "PEANUT  oil" }], ["땅콩"])
    ).toHaveLength(1);
  });

  it("알러지가 없으면 위반도 없다", () => {
    expect(findAllergenViolations([{ name: "땅콩" }], [])).toHaveLength(0);
  });

  it("안전한 재료는 통과한다", () => {
    expect(
      findAllergenViolations(
        [{ name: "닭가슴살" }, { name: "현미밥" }, { name: "브로콜리" }],
        ["땅콩", "갑각류", "우유(유제품)"]
      )
    ).toHaveLength(0);
  });
});

describe("validateRecipe — 통합 검증 (알러지 + 칼로리)", () => {
  const baseRecipe: RecipeResponse = {
    title: "닭가슴살 덮밥",
    description: "테스트",
    servings: 1,
    totalCalories: 650,
    ingredients: [
      { name: "닭가슴살", amount: 200, unit: "g", calories: 330 },
      { name: "현미밥", amount: 210, unit: "g", calories: 320 },
    ],
    steps: ["조리한다"],
    usedTools: ["프라이팬"],
    missingIngredients: [],
  };

  it("알러지 위반이 없고 칼로리가 목표 ±5% 이내면 통과", () => {
    const result = validateRecipe(baseRecipe, {
      targetCalories: 650,
      profile: { allergies: ["땅콩"], religiousRestrictions: [], healthConditions: [] },
    });
    expect(result.ok).toBe(true);
    expect(result.computedTotal).toBe(650);
  });

  it("알러지 재료가 포함되면 칼로리가 맞아도 거부한다", () => {
    const recipe = {
      ...baseRecipe,
      ingredients: [
        { name: "땅콩소스", amount: 30, unit: "g", calories: 180 },
        { name: "현미밥", amount: 300, unit: "g", calories: 470 },
      ],
    };
    const result = validateRecipe(recipe, {
      targetCalories: 650,
      profile: { allergies: ["땅콩"], religiousRestrictions: [], healthConditions: [] },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("알러지");
  });

  it("칼로리가 목표 ±5%를 벗어나면 거부한다", () => {
    const result = validateRecipe(baseRecipe, {
      targetCalories: 500,
      profile: { allergies: [], religiousRestrictions: [], healthConditions: [] },
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("±5%");
  });
});
