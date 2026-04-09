import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { weightSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);
  const { searchParams } = new URL(request.url);

  if (searchParams.get("latest") === "true") {
    const latest = await prisma.weight.findFirst({
      where: { profileId: profile.id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(
      latest ? { weight: latest.weight, date: latest.date } : { weight: null }
    );
  }

  const weights = await prisma.weight.findMany({
    where: { profileId: profile.id },
    orderBy: { date: "asc" },
    select: { id: true, date: true, weight: true },
  });

  return NextResponse.json(weights);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = weightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);

  const weight = await prisma.weight.upsert({
    where: {
      profileId_date: { profileId: profile.id, date: parsed.data.date },
    },
    update: { weight: parsed.data.weight },
    create: {
      profileId: profile.id,
      date: parsed.data.date,
      weight: parsed.data.weight,
    },
  });

  return NextResponse.json(weight);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const profile = await getOrCreateProfile(userId);

  await prisma.weight.deleteMany({
    where: { id, profileId: profile.id },
  });

  return NextResponse.json({ success: true });
}
