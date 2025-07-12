import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ skills });
} 