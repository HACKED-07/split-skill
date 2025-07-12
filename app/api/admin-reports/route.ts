import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

async function isAdmin(req: Request) {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

function toCSV(rows: any[], headers: string[]): string {
  return [headers.join(","), ...rows.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","))].join("\n");
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url!);
  const type = url.searchParams.get("type");
  if (type === "users") {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, banned: true, createdAt: true } });
    const csv = toCSV(users, ["id", "name", "email", "role", "banned", "createdAt"]);
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=users.csv" } });
  } else if (type === "swaps") {
    const swaps = await prisma.swapRequest.findMany({ select: { id: true, fromUserId: true, toUserId: true, offeredSkillId: true, wantedSkillId: true, status: true, createdAt: true } });
    const csv = toCSV(swaps, ["id", "fromUserId", "toUserId", "offeredSkillId", "wantedSkillId", "status", "createdAt"]);
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=swaps.csv" } });
  } else if (type === "feedback") {
    const feedback = await prisma.feedback.findMany({ select: { id: true, swapId: true, rating: true, comment: true, createdAt: true } });
    const csv = toCSV(feedback, ["id", "swapId", "rating", "comment", "createdAt"]);
    return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=feedback.csv" } });
  }
  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
