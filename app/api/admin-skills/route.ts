import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

async function isAdmin(req: Request) {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const skills = await prisma.skill.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(skills);
}

export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { skillId, approved } = await req.json();
  if (!skillId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const skill = await prisma.skill.update({
    where: { id: skillId },
    data: { approved },
  });
  return NextResponse.json(skill);
}
