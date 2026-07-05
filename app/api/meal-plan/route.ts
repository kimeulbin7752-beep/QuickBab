import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { splitDailyCalories } from "@/lib/calorie";

// 하루 총 칼로리 → 아침/점심/저녁 배분 제안 (간단 버전)
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = z
    .object({ dailyCalories: z.number().int().min(800).max(6000) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const meals = splitDailyCalories(parsed.data.dailyCalories);

  const plan = await prisma.mealPlan.create({
    data: {
      userId,
      totalCalories: parsed.data.dailyCalories,
      meals: JSON.stringify(meals),
    },
  });

  return NextResponse.json({ planId: plan.id, meals });
}
