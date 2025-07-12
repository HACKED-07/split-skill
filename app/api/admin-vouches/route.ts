import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const vouches = await prisma.vouch.findMany({
    include: {
      voucher: { select: { id: true, name: true } },
      vouched: { select: { id: true, name: true } },
      swap: {
        select: {
          id: true,
          offeredSkill: { select: { name: true, type: true } },
          wantedSkill: { select: { name: true, type: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vouches);
} 