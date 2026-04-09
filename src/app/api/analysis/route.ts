import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { analyzeTrend } from "@/logic/trend";
import { recommendAction } from "@/logic/recommendation";
import { calculateWeightStats } from "@/logic/weight-stats";
import type { PhaseId } from "@/logic/phases";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);

  const weights = await prisma.weight.findMany({
    where: { profileId: profile.id },
    orderBy: { date: "asc" },
  });

  const weightEntries = weights.map((w) => ({ date: w.date, w: w.weight }));

  // Trend analysis
  const palier = profile.palier;
  let trend = null;
  let recommendation = null;

  if (palier && weightEntries.length > 0) {
    trend = analyzeTrend(weightEntries, palier.startDate, palier.kcal);
    if (trend) {
      recommendation = recommendAction(
        profile.phase as PhaseId,
        trend,
        palier.kcal
      );
    }
  }

  // Weight stats
  const weightStats = calculateWeightStats(
    weightEntries,
    profile.height,
    profile.goalWeight
  );

  return NextResponse.json({
    trend,
    recommendation,
    weightStats,
  });
}
