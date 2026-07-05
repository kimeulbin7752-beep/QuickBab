import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      totalCalories: true,
      targetCalories: true,
      servings: true,
      pantryMode: true,
      kitchenMode: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ recipes });
}
