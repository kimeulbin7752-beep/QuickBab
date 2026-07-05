import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tools = await prisma.kitchenTool.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ tools });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = z
    .object({ name: z.string().trim().min(1).max(50) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const tool = await prisma.kitchenTool.upsert({
    where: { userId_name: { userId, name: parsed.data.name } },
    update: {},
    create: { userId, name: parsed.data.name },
  });
  return NextResponse.json({ tool }, { status: 201 });
}
