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
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getServerSession(authOptions);
  const { userId, banned } = await req.json();
  if (!userId || typeof banned !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (session?.user?.id === userId) {
    return NextResponse.json({ error: "You cannot ban yourself." }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { banned },
  });
  return NextResponse.json(user);
}
