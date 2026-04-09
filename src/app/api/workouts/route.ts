import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { workoutSchema } from "@/lib/validators";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);

  const workouts = await prisma.workout.findMany({
    where: { profileId: profile.id },
    include: { muscles: { select: { name: true, sets: true } } },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return NextResponse.json(
    workouts.map((w) => ({
      id: w.id,
      date: w.date,
      type: w.type,
      duration: w.duration,
      calories: w.calories,
      notes: w.notes,
      muscles: w.muscles,
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = workoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);
  const { muscles, ...workoutData } = parsed.data;

  const workout = await prisma.workout.create({
    data: {
      profileId: profile.id,
      ...workoutData,
      muscles: muscles?.length
        ? { create: muscles.map((m) => ({ name: m.name, sets: m.sets })) }
        : undefined,
    },
    include: { muscles: { select: { name: true, sets: true } } },
  });

  return NextResponse.json({
    id: workout.id,
    date: workout.date,
    type: workout.type,
    duration: workout.duration,
    calories: workout.calories,
    notes: workout.notes,
    muscles: workout.muscles,
  });
}
