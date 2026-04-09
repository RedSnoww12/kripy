import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { waterSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const log = await prisma.waterLog.findUnique({
    where: { profileId_date: { profileId: profile.id, date } },
  });

  return NextResponse.json({ glasses: log?.glasses || 0 });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = waterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);

  const log = await prisma.waterLog.upsert({
    where: { profileId_date: { profileId: profile.id, date: parsed.data.date } },
    update: { glasses: parsed.data.glasses },
    create: { profileId: profile.id, ...parsed.data },
  });

  return NextResponse.json(log);
}
