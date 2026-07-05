import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { generateRecipe } from "@/lib/recipe-engine";

export const maxDuration = 300; // AI 재시도 포함 장시간 실행 허용

const GenerateSchema = z.object({
  targetCalories: z.number().int().min(100).max(5000).optional(),
  servings: z.number().int().min(1).max(10).default(1),
  request: z.string().max(500).optional(),
  pantryMode: z.boolean().default(false),
  kitchenMode: z.boolean().default(false),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = GenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const body = parsed.data;

  // 저장된 프로필/팬트리/키친을 자동으로 반영
  const [profile, pantryItems, kitchenTools] = await Promise.all([
    prisma.dietaryProfile.findUnique({ where: { userId } }),
    prisma.pantryItem.findMany({ where: { userId } }),
    prisma.kitchenTool.findMany({ where: { userId } }),
  ]);

  try {
    const result = await generateRecipe({
      targetCalories: body.targetCalories,
      servings: body.servings,
      request: body.request,
      profile: {
        allergies: profile ? JSON.parse(profile.allergies) : [],
        religiousRestrictions: profile
          ? JSON.parse(profile.religiousRestrictions)
          : [],
        healthConditions: profile ? JSON.parse(profile.healthConditions) : [],
      },
      pantry: pantryItems.map((i) => i.name),
      kitchenTools: kitchenTools.map((t) => t.name),
      pantryMode: body.pantryMode,
      kitchenMode: body.kitchenMode,
    });

    const saved = await prisma.recipe.create({
      data: {
        userId,
        title: result.recipe.title,
        description: result.recipe.description,
        servings: result.recipe.servings,
        totalCalories: result.computedTotalCalories,
        targetCalories: body.targetCalories ?? null,
        ingredients: JSON.stringify(result.recipe.ingredients),
        steps: JSON.stringify(result.recipe.steps),
        usedTools: JSON.stringify(result.recipe.usedTools),
        missingIngredients: JSON.stringify(result.recipe.missingIngredients),
        pantryMode: body.pantryMode,
        kitchenMode: body.kitchenMode,
      },
    });

    return NextResponse.json({ recipeId: saved.id, attempts: result.attempts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "레시피 생성에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
