"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/components/useRequireAuth";

interface MealSplit {
  meal: string;
  calories: number;
  ratio: number;
}

export default function GeneratePage() {
  useRequireAuth();
  const router = useRouter();

  const [targetCalories, setTargetCalories] = useState<string>("650");
  const [useTarget, setUseTarget] = useState(true);
  const [servings, setServings] = useState(1);
  const [request, setRequest] = useState("");
  const [pantryMode, setPantryMode] = useState(false);
  const [kitchenMode, setKitchenMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 하루 칼로리 배분
  const [dailyCalories, setDailyCalories] = useState<string>("2000");
  const [mealSplit, setMealSplit] = useState<MealSplit[] | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories: useTarget ? Number(targetCalories) : undefined,
          servings,
          request: request || undefined,
          pantryMode,
          kitchenMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      router.push(`/recipe/${data.recipeId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "레시피 생성에 실패했습니다");
      setLoading(false);
    }
  }

  async function splitDaily() {
    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyCalories: Number(dailyCalories) }),
    });
    if (res.ok) {
      const data = await res.json();
      setMealSplit(data.meals);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="card">
        <h1 className="text-2xl font-bold">레시피 생성</h1>
        <p className="mt-1 text-sm text-stone-500">
          저장된 식이 프로필이 자동으로 반영됩니다.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={useTarget}
                onChange={(e) => setUseTarget(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              칼로리 정밀 매칭 (±5%)
            </label>
            {useTarget && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={5000}
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  className="input max-w-[140px]"
                />
                <span className="text-sm text-stone-500">
                  kcal 목표 (허용:{" "}
                  {Math.round(Number(targetCalories || 0) * 0.95)}~
                  {Math.round(Number(targetCalories || 0) * 1.05)}kcal)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold">인분</label>
            <input
              type="number"
              min={1}
              max={10}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="input mt-1 max-w-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">요청 사항 (선택)</label>
            <input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="예: 매콤한 한식, 15분 안에 완성"
              className="input mt-1"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-stone-50 p-4 sm:flex-row sm:gap-8">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pantryMode}
                onChange={(e) => setPantryMode(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span>
                <strong>팬트리 모드</strong> — 보유 재료 위주로 생성
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={kitchenMode}
                onChange={(e) => setKitchenMode(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span>
                <strong>키친 모드</strong> — 보유 도구만 사용
              </span>
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={loading || (useTarget && !Number(targetCalories))}
            className="btn-primary w-full py-3 text-base"
          >
            {loading
              ? "AI가 레시피를 설계하는 중... (검증 실패 시 자동 재시도)"
              : "레시피 생성하기"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">하루 칼로리 배분</h2>
        <p className="mt-1 text-sm text-stone-500">
          하루 총 칼로리를 입력하면 아침/점심/저녁 배분을 제안해요.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min={800}
            max={6000}
            value={dailyCalories}
            onChange={(e) => setDailyCalories(e.target.value)}
            className="input max-w-[140px]"
          />
          <span className="text-sm text-stone-500">kcal / 일</span>
          <button onClick={splitDaily} className="btn-secondary">
            배분 계산
          </button>
        </div>
        {mealSplit && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {mealSplit.map((m) => (
              <button
                key={m.meal}
                onClick={() => {
                  setUseTarget(true);
                  setTargetCalories(String(m.calories));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-center transition hover:border-brand-400"
                title="클릭하면 목표 칼로리로 설정"
              >
                <p className="text-sm text-stone-500">
                  {m.meal} ({Math.round(m.ratio * 100)}%)
                </p>
                <p className="text-lg font-bold text-brand-600">
                  {m.calories}kcal
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
