import { getUserId } from "@/lib/auth";
import { getOrCreateProfile, updateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);
  return NextResponse.json({
    height: profile.height,
    goalWeight: profile.goalWeight,
    stepsGoal: profile.stepsGoal,
    activityLevel: profile.activityLevel,
    phase: profile.phase,
    theme: profile.theme,
    setupDone: profile.setupDone,
  });
}

export async function PUT(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const profile = await updateProfile(userId, body);
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Onboarding: create profile + initial weight + targets
  const profile = await getOrCreateProfile(userId);

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: {
        height: body.height,
        goalWeight: body.goalWeight,
        activityLevel: body.activityLevel,
        phase: body.phase,
        setupDone: true,
      },
    }),
    prisma.weight.upsert({
      where: {
        profileId_date: {
          profileId: profile.id,
          date: new Date().toISOString().slice(0, 10),
        },
      },
      update: { weight: body.weight },
      create: {
        profileId: profile.id,
        date: new Date().toISOString().slice(0, 10),
        weight: body.weight,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
