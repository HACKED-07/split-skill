import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Level thresholds
const LEVELS = [0, 5, 10, 20, 35]; // Level 1: 0-4, 2: 5-9, 3: 10-19, 4: 20-34, 5: 35+

function getLevel(vouches: number) {
  if (vouches >= LEVELS[4]) return 5;
  if (vouches >= LEVELS[3]) return 4;
  if (vouches >= LEVELS[2]) return 3;
  if (vouches >= LEVELS[1]) return 2;
  return 1;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  // Count vouches received
  const vouchesReceived = await prisma.vouch.count({ where: { vouchedId: userId } });
  // Count swaps completed (ACCEPTED as fromUser or toUser)
  const swapsCompleted = await prisma.swapRequest.count({
    where: {
      status: "ACCEPTED",
      OR: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
    },
  });

  // Achievements
  const achievements: string[] = [];
  if (vouchesReceived > 0) achievements.push("First Vouch Received");
  if (vouchesReceived >= 5) achievements.push("5 Vouches Received");
  if (swapsCompleted > 0) achievements.push("First Swap Completed");
  if (swapsCompleted >= 5) achievements.push("5 Swaps Completed");
  if (swapsCompleted >= 10) achievements.push("10 Swaps Completed");

  const level = getLevel(vouchesReceived);

  return NextResponse.json({
    level,
    vouchesReceived,
    swapsCompleted,
    achievements,
  });
} 