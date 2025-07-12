import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET: Fetch all messages for a swap
export async function GET(req: Request, { params }: { params: { swapId: string } }) {
  const { swapId } = params;
  if (!swapId) return NextResponse.json({ error: "Missing swapId" }, { status: 400 });
  const messages = await prisma.message.findMany({
    where: { swapId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(messages);
}

// POST: Add a new message to a swap
export async function POST(req: Request, { params }: { params: { swapId: string } }) {
  const { swapId } = params;
  if (!swapId) return NextResponse.json({ error: "Missing swapId" }, { status: 400 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Missing content" }, { status: 400 });

  // Check if user is part of the swap
  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapId },
    select: { fromUserId: true, toUserId: true, status: true },
  });
  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.status !== "ACCEPTED") return NextResponse.json({ error: "Chat only allowed for accepted swaps" }, { status: 403 });
  if (![swap.fromUserId, swap.toUserId].includes(session.user.id)) {
    return NextResponse.json({ error: "Not a participant in this swap" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      swapId,
      senderId: session.user.id,
      content,
    },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(message);
} 