import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const ProfileSchema = z.object({
  allergies: z.array(z.string()).default([]),
  religiousRestrictions: z.array(z.string()).default([]),
  healthConditions: z.array(z.string()).default([]),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.dietaryProfile.findUnique({ where: { userId } });
  return NextResponse.json({
    allergies: profile ? JSON.parse(profile.allergies) : [],
    religiousRestrictions: profile ? JSON.parse(profile.religiousRestrictions) : [],
    healthConditions: profile ? JSON.parse(profile.healthConditions) : [],
    exists: Boolean(profile),
  });
}

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = ProfileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const data = {
    allergies: JSON.stringify(parsed.data.allergies),
    religiousRestrictions: JSON.stringify(parsed.data.religiousRestrictions),
    healthConditions: JSON.stringify(parsed.data.healthConditions),
  };

  await prisma.dietaryProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json({ ok: true });
}
