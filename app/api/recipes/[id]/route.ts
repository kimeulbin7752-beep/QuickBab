import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const recipe = await prisma.recipe.findFirst({
    where: { id: params.id, userId },
  });
  if (!recipe) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    recipe: {
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
      usedTools: JSON.parse(recipe.usedTools),
      missingIngredients: JSON.parse(recipe.missingIngredients),
    },
  });
}
