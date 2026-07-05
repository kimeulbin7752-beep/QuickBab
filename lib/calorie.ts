// 칼로리 정밀 매칭 관련 핵심 로직
// (AI 응답을 그대로 신뢰하지 않고 서버 측에서 반드시 재검증한다)

export interface IngredientLine {
  name: string;
  amount: number;
  unit: string;
  calories: number;
}

export const CALORIE_TOLERANCE = 0.05; // ±5%

/** 재료별 칼로리를 합산한다. 유효하지 않은 값은 0으로 취급. */
export function sumIngredientCalories(ingredients: IngredientLine[]): number {
  return ingredients.reduce((sum, ing) => {
    const cal = Number(ing.calories);
    return sum + (Number.isFinite(cal) && cal > 0 ? cal : 0);
  }, 0);
}

/** 총 칼로리가 목표치의 ±tolerance 이내인지 검사한다. */
export function isWithinCalorieTolerance(
  totalCalories: number,
  targetCalories: number,
  tolerance: number = CALORIE_TOLERANCE
): boolean {
  if (!Number.isFinite(totalCalories) || !Number.isFinite(targetCalories)) {
    return false;
  }
  if (targetCalories <= 0) return false;
  const diff = Math.abs(totalCalories - targetCalories);
  return diff <= targetCalories * tolerance;
}

/**
 * 레시피가 주장하는 totalCalories와 재료 합산치의 정합성 +
 * 목표 칼로리 허용 오차를 함께 검증한다.
 */
export function validateCalories(
  ingredients: IngredientLine[],
  claimedTotal: number,
  targetCalories?: number
): { ok: boolean; computedTotal: number; reason?: string } {
  const computedTotal = sumIngredientCalories(ingredients);

  // AI가 주장한 합계와 재료 합산치가 크게 어긋나면 신뢰 불가 (10% 이상 차이)
  if (
    claimedTotal > 0 &&
    Math.abs(computedTotal - claimedTotal) > Math.max(claimedTotal * 0.1, 30)
  ) {
    return {
      ok: false,
      computedTotal,
      reason: `재료 합산(${computedTotal}kcal)과 표기 총량(${claimedTotal}kcal)이 일치하지 않습니다`,
    };
  }

  if (targetCalories && targetCalories > 0) {
    if (!isWithinCalorieTolerance(computedTotal, targetCalories)) {
      return {
        ok: false,
        computedTotal,
        reason: `합산 칼로리(${computedTotal}kcal)가 목표(${targetCalories}kcal)의 ±5%를 벗어났습니다`,
      };
    }
  }

  return { ok: true, computedTotal };
}

/** 하루 총 칼로리를 아침/점심/저녁으로 배분 (30% / 40% / 30%) */
export function splitDailyCalories(
  dailyTotal: number
): { meal: string; calories: number; ratio: number }[] {
  const ratios = [
    { meal: "아침", ratio: 0.3 },
    { meal: "점심", ratio: 0.4 },
    { meal: "저녁", ratio: 0.3 },
  ];
  const meals = ratios.map(({ meal, ratio }) => ({
    meal,
    ratio,
    calories: Math.round(dailyTotal * ratio),
  }));
  // 반올림 오차 보정: 차액을 점심에 반영해 합계를 정확히 맞춘다
  const diff = dailyTotal - meals.reduce((s, m) => s + m.calories, 0);
  meals[1].calories += diff;
  return meals;
}
