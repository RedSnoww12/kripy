import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mealItemSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const logDay = await prisma.mealLogDay.findUnique({
    where: { profileId_date: { profileId: profile.id, date } },
    include: { items: true },
  });

  return NextResponse.json({
    items: logDay?.items.map((i) => ({
      id: i.id,
      food: i.food,
      meal: i.meal,
      qty: i.qty,
      kcal: i.kcal,
      prot: i.prot,
      gluc: i.gluc,
      lip: i.lip,
      fib: i.fib,
    })) || [],
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, ...itemData } = body;
  const parsed = mealItemSchema.safeParse(itemData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);

  // Get or create log day
  let logDay = await prisma.mealLogDay.findUnique({
    where: { profileId_date: { profileId: profile.id, date } },
  });

  if (!logDay) {
    logDay = await prisma.mealLogDay.create({
      data: { profileId: profile.id, date },
    });
  }

  const item = await prisma.mealItem.create({
    data: { logDayId: logDay.id, ...parsed.data },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify ownership through profile -> logDay -> item chain
  const profile = await getOrCreateProfile(userId);
  const item = await prisma.mealItem.findUnique({
    where: { id },
    include: { logDay: true },
  });

  if (!item || item.logDay.profileId !== profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mealItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
