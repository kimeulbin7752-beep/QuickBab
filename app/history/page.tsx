"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/components/useRequireAuth";

interface RecipeSummary {
  id: string;
  title: string;
  description: string;
  totalCalories: number;
  targetCalories: number | null;
  servings: number;
  pantryMode: boolean;
  kitchenMode: boolean;
  createdAt: string;
}

export default function HistoryPage() {
  useRequireAuth();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRecipes(data?.recipes ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">레시피 히스토리</h1>
      <p className="mt-1 text-sm text-stone-500">
        지금까지 생성한 레시피 기록입니다.
      </p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-stone-500">불러오는 중...</p>
        ) : recipes.length === 0 ? (
          <div className="card text-center">
            <p className="text-stone-500">아직 생성한 레시피가 없어요.</p>
            <Link href="/generate" className="btn-primary mt-4 inline-flex">
              첫 레시피 생성하기
            </Link>
          </div>
        ) : (
          recipes.map((r) => (
            <Link
              key={r.id}
              href={`/recipe/${r.id}`}
              className="card block transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">{r.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                    {r.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-brand-600">{r.totalCalories}kcal</p>
                  {r.targetCalories != null && (
                    <p className="text-xs text-stone-400">
                      목표 {r.targetCalories}kcal
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                <span>{r.servings}인분</span>
                {r.pantryMode && <span className="text-brand-600">팬트리 모드</span>}
                {r.kitchenMode && <span className="text-brand-600">키친 모드</span>}
                <span>{new Date(r.createdAt).toLocaleString("ko-KR")}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
