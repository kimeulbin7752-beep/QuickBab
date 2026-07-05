"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/components/useRequireAuth";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
}

interface RecipeDetail {
  id: string;
  title: string;
  description: string;
  servings: number;
  totalCalories: number;
  targetCalories: number | null;
  ingredients: Ingredient[];
  steps: string[];
  usedTools: string[];
  missingIngredients: string[];
  createdAt: string;
}

interface OrderResult {
  orderId: string;
  cart: { name: string; price: number; quantity: number; vendor: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDelivery: string;
}

export default function RecipeDetailPage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRecipe(data?.recipe ?? null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function orderMissing() {
    if (!recipe || recipe.missingIngredients.length === 0) return;
    setOrdering(true);
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: recipe.missingIngredients }),
    });
    setOrdering(false);
    if (res.ok) setOrder(await res.json());
  }

  if (loading) return <p className="text-stone-500">불러오는 중...</p>;
  if (!recipe) return <p className="text-stone-500">레시피를 찾을 수 없습니다.</p>;

  const withinTarget =
    recipe.targetCalories != null &&
    Math.abs(recipe.totalCalories - recipe.targetCalories) <=
      recipe.targetCalories * 0.05;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{recipe.title}</h1>
        <p className="mt-2 text-stone-600">{recipe.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {recipe.servings}인분
          </span>
          <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand-700">
            총 {recipe.totalCalories}kcal
          </span>
          {recipe.targetCalories != null && (
            <span
              className={`rounded-full px-3 py-1 ${
                withinTarget
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              목표 {recipe.targetCalories}kcal {withinTarget ? "✓ ±5% 달성" : ""}
            </span>
          )}
          {recipe.usedTools.map((t) => (
            <span key={t} className="rounded-full bg-stone-100 px-3 py-1">
              🍳 {t}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">재료별 칼로리 분해표</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="pb-2">재료</th>
              <th className="pb-2">분량</th>
              <th className="pb-2 text-right">칼로리</th>
              <th className="pb-2 text-right">비중</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map((ing, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-2 font-medium">{ing.name}</td>
                <td className="py-2 text-stone-600">
                  {ing.amount}
                  {ing.unit}
                </td>
                <td className="py-2 text-right">{ing.calories}kcal</td>
                <td className="py-2 text-right text-stone-500">
                  {recipe.totalCalories > 0
                    ? Math.round((ing.calories / recipe.totalCalories) * 100)
                    : 0}
                  %
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="pt-3">합계</td>
              <td />
              <td className="pt-3 text-right text-brand-600">
                {recipe.totalCalories}kcal
              </td>
              <td className="pt-3 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">조리 단계</h2>
        <ol className="mt-4 space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {recipe.missingIngredients.length > 0 && (
        <div className="card border-brand-200 bg-brand-50/50">
          <h2 className="text-lg font-bold">부족한 재료</h2>
          <p className="mt-1 text-sm text-stone-500">
            팬트리에 없는 재료예요. 장바구니에 담아 주문할 수 있어요. (모의 주문)
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recipe.missingIngredients.map((m) => (
              <li key={m} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                {m}
              </li>
            ))}
          </ul>
          {!order ? (
            <button
              onClick={orderMissing}
              disabled={ordering}
              className="btn-primary mt-4"
            >
              {ordering ? "담는 중..." : "🛒 장바구니 담기"}
            </button>
          ) : (
            <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
              <h3 className="font-semibold">주문서 ({order.orderId})</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {order.cart.map((c) => (
                  <li key={c.name} className="flex justify-between">
                    <span>
                      {c.name} × {c.quantity}
                    </span>
                    <span>{c.price.toLocaleString()}원</span>
                  </li>
                ))}
                <li className="flex justify-between text-stone-500">
                  <span>배송비</span>
                  <span>
                    {order.deliveryFee === 0
                      ? "무료"
                      : `${order.deliveryFee.toLocaleString()}원`}
                  </span>
                </li>
                <li className="flex justify-between border-t border-stone-200 pt-2 font-bold">
                  <span>총액</span>
                  <span>{order.total.toLocaleString()}원</span>
                </li>
              </ul>
              <p className="mt-2 text-xs text-stone-500">
                {order.estimatedDelivery}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
