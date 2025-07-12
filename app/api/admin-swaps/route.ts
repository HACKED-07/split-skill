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
  const swaps = await prisma.swapRequest.findMany({
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      offeredSkill: true,
      wantedSkill: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(swaps);
}
