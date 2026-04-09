import { prisma } from "@/lib/prisma";

export async function getOrCreateProfile(userId: string) {
  let profile = await prisma.profile.findUnique({
    where: { userId },
    include: { targets: true, palier: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        targets: { create: {} },
        palier: {
          create: {
            kcal: 2200,
            startDate: new Date().toISOString().slice(0, 10),
          },
        },
      },
      include: { targets: true, palier: true },
    });
  }

  return profile;
}

export async function updateProfile(
  userId: string,
  data: {
    height?: number;
    goalWeight?: number;
    stepsGoal?: number;
    activityLevel?: string;
    phase?: string;
    theme?: string;
    setupDone?: boolean;
  }
) {
  return prisma.profile.update({
    where: { userId },
    data,
  });
}
