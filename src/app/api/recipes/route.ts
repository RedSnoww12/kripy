import { getUserId } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { recipeSchema } from "@/lib/validators";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getOrCreateProfile(userId);

  const recipes = await prisma.recipe.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    recipes.map((r) => ({
      id: r.id,
      name: r.name,
      kcal: r.kcal,
      prot: r.prot,
      gluc: r.gluc,
      lip: r.lip,
      fib: r.fib,
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getOrCreateProfile(userId);

  const recipe = await prisma.recipe.create({
    data: { profileId: profile.id, ...parsed.data },
  });

  return NextResponse.json({
    id: recipe.id,
    name: recipe.name,
    kcal: recipe.kcal,
    prot: recipe.prot,
    gluc: recipe.gluc,
    lip: recipe.lip,
    fib: recipe.fib,
  });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const profile = await getOrCreateProfile(userId);
  await prisma.recipe.deleteMany({
    where: { id, profileId: profile.id },
  });

  return NextResponse.json({ success: true });
}
