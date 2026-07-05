import { describe, expect, it } from "vitest";
import {
  isWithinCalorieTolerance,
  splitDailyCalories,
  sumIngredientCalories,
  validateCalories,
} from "@/lib/calorie";

describe("sumIngredientCalories", () => {
  it("재료별 칼로리를 합산한다", () => {
    expect(
      sumIngredientCalories([
        { name: "닭가슴살", amount: 150, unit: "g", calories: 165 },
        { name: "현미밥", amount: 150, unit: "g", calories: 220 },
        { name: "올리브오일", amount: 5, unit: "ml", calories: 45 },
      ])
    ).toBe(430);
  });

  it("음수/NaN 칼로리는 0으로 취급한다", () => {
    expect(
      sumIngredientCalories([
        { name: "a", amount: 1, unit: "g", calories: -50 },
        { name: "b", amount: 1, unit: "g", calories: NaN },
        { name: "c", amount: 1, unit: "g", calories: 100 },
      ])
    ).toBe(100);
  });
});

describe("isWithinCalorieTolerance (±5%)", () => {
  it("정확히 목표치이면 통과", () => {
    expect(isWithinCalorieTolerance(650, 650)).toBe(true);
  });

  it("±5% 경계값을 포함해 통과", () => {
    expect(isWithinCalorieTolerance(617.5, 650)).toBe(true); // -5%
    expect(isWithinCalorieTolerance(682.5, 650)).toBe(true); // +5%
  });

  it("±5%를 벗어나면 실패", () => {
    expect(isWithinCalorieTolerance(617, 650)).toBe(false);
    expect(isWithinCalorieTolerance(683, 650)).toBe(false);
    expect(isWithinCalorieTolerance(500, 650)).toBe(false);
  });

  it("목표가 0 이하이거나 값이 유한하지 않으면 실패", () => {
    expect(isWithinCalorieTolerance(100, 0)).toBe(false);
    expect(isWithinCalorieTolerance(NaN, 650)).toBe(false);
    expect(isWithinCalorieTolerance(Infinity, 650)).toBe(false);
  });
});

describe("validateCalories", () => {
  const ingredients = [
    { name: "닭가슴살", amount: 200, unit: "g", calories: 330 },
    { name: "현미밥", amount: 200, unit: "g", calories: 290 },
  ]; // 합계 620

  it("합산이 목표 ±5% 이내이고 표기 총량과 일치하면 통과", () => {
    const result = validateCalories(ingredients, 620, 650);
    expect(result.ok).toBe(true);
    expect(result.computedTotal).toBe(620);
  });

  it("AI가 주장한 총량이 재료 합산과 크게 다르면 실패", () => {
    const result = validateCalories(ingredients, 900, undefined);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("일치하지 않습니다");
  });

  it("합산이 목표 ±5%를 벗어나면 실패", () => {
    const result = validateCalories(ingredients, 620, 800);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("±5%");
  });

  it("목표 칼로리가 없으면 정합성만 검증한다", () => {
    expect(validateCalories(ingredients, 620).ok).toBe(true);
  });
});

describe("splitDailyCalories", () => {
  it("아침 30% / 점심 40% / 저녁 30%로 배분한다", () => {
    const meals = splitDailyCalories(2000);
    expect(meals).toHaveLength(3);
    expect(meals[0]).toMatchObject({ meal: "아침", calories: 600 });
    expect(meals[1]).toMatchObject({ meal: "점심", calories: 800 });
    expect(meals[2]).toMatchObject({ meal: "저녁", calories: 600 });
  });

  it("반올림 오차가 있어도 합계는 정확히 총량과 같다", () => {
    for (const total of [1999, 2001, 1847, 3333]) {
      const meals = splitDailyCalories(total);
      expect(meals.reduce((s, m) => s + m.calories, 0)).toBe(total);
    }
  });
});
