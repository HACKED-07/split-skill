import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const skills = await prisma.skill.findMany({
    where: { userId },
    select: { id: true, name: true, type: true, approved: true },
  });
  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const { userId, name, type } = await req.json();
  if (!userId || typeof userId !== "string") return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
  if (!name || typeof name !== "string") return NextResponse.json({ error: "Missing or invalid skill name" }, { status: 400 });
  if (!type || (type !== "OFFERED" && type !== "WANTED")) return NextResponse.json({ error: "Missing or invalid skill type" }, { status: 400 });
  const skill = await prisma.skill.create({
    data: { userId, name, type },
    select: { id: true, name: true, type: true, approved: true },
  });
  return NextResponse.json(skill);
}

export async function PUT(req: Request) {
  const { skillId, name, type } = await req.json();
  if (!skillId || typeof skillId !== "string") return NextResponse.json({ error: "Missing or invalid skillId" }, { status: 400 });
  if (!name || typeof name !== "string") return NextResponse.json({ error: "Missing or invalid skill name" }, { status: 400 });
  if (!type || (type !== "OFFERED" && type !== "WANTED")) return NextResponse.json({ error: "Missing or invalid skill type" }, { status: 400 });
  const skill = await prisma.skill.update({
    where: { id: skillId },
    data: { name, type },
    select: { id: true, name: true, type: true, approved: true },
  });
  return NextResponse.json(skill);
}

export async function DELETE(req: Request) {
  const { skillId } = await req.json();
  if (!skillId || typeof skillId !== "string") return NextResponse.json({ error: "Missing or invalid skillId" }, { status: 400 });
  await prisma.skill.delete({ where: { id: skillId } });
  return NextResponse.json({ success: true });
}
