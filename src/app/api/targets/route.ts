import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { targetsSchema } from "@/lib/validators";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);
  const targets = profile.targets ?? { kcal: 2200, prot: 150, gluc: 250, lip: 75, fib: 30 };

  return NextResponse.json({
    kcal: targets.kcal,
    prot: targets.prot,
    gluc: targets.gluc,
    lip: targets.lip,
    fib: targets.fib,
  });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = targetsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);

  const targets = await prisma.targets.upsert({
    where: { profileId: profile.id },
    update: parsed.data,
    create: { profileId: profile.id, ...parsed.data },
  });

  // Check if palier needs reset (kcal changed)
  if (profile.palier && profile.palier.kcal !== parsed.data.kcal) {
    await prisma.palier.update({
      where: { profileId: profile.id },
      data: {
        kcal: parsed.data.kcal,
        startDate: new Date().toISOString().slice(0, 10),
      },
    });
  }

  return NextResponse.json(targets);
}
