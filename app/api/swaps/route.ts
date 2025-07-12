import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// List swaps for a user (sent or received)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const swaps = await prisma.swapRequest.findMany({
    where: {
      OR: [
        { fromUserId: userId },
        { toUserId: userId },
      ],
    },
    include: {
      fromUser: { select: { id: true, name: true, image: true } },
      toUser: { select: { id: true, name: true, image: true } },
      offeredSkill: true,
      wantedSkill: true,
      feedback: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(swaps);
}

// Create a swap request
export async function POST(req: Request) {
  const body = await req.json();
  console.log('SWAP REQUEST BODY:', body);
  const { fromUserId, toUserId, offeredSkillId, wantedSkillId, message } = body;
  if (!fromUserId || !toUserId || !offeredSkillId || !wantedSkillId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Prevent duplicate pending swap requests
  const existing = await prisma.swapRequest.findFirst({
    where: {
      fromUserId,
      toUserId,
      offeredSkillId,
      wantedSkillId,
      status: "PENDING",
    },
  });
  if (existing) {
    return NextResponse.json({ error: "A pending swap request already exists for these users and skills." }, { status: 409 });
  }
  const swap = await prisma.swapRequest.create({
    data: {
      fromUserId,
      toUserId,
      offeredSkillId,
      wantedSkillId,
      message,
    },
    include: {
      fromUser: { select: { id: true, name: true, image: true } },
      toUser: { select: { id: true, name: true, image: true } },
      offeredSkill: true,
      wantedSkill: true,
    },
  });
  return NextResponse.json(swap);
}

// Update swap status or add feedback
export async function PUT(req: Request) {
  const { swapId, status, feedback, rating, comment } = await req.json();
  if (!swapId) return NextResponse.json({ error: "Missing swapId" }, { status: 400 });
  let swap;
  if (status) {
    swap = await prisma.swapRequest.update({
      where: { id: swapId },
      data: { status },
    });
  }
  if (feedback && rating) {
    await prisma.feedback.create({
      data: {
        swapId,
        rating,
        comment,
      },
    });
  }
  return NextResponse.json({ success: true });
}

// Delete swap (if not accepted)
export async function DELETE(req: Request) {
  const { swapId } = await req.json();
  if (!swapId) return NextResponse.json({ error: "Missing swapId" }, { status: 400 });
  const swap = await prisma.swapRequest.findUnique({ where: { id: swapId } });
  if (!swap || swap.status === "ACCEPTED") {
    return NextResponse.json({ error: "Cannot delete accepted swap" }, { status: 400 });
  }
  await prisma.swapRequest.delete({ where: { id: swapId } });
  return NextResponse.json({ success: true });
}

// Vouch for a user after a completed swap
export async function PATCH(req: Request) {
  const { voucherId, vouchedId, swapId } = await req.json();
  if (!voucherId || !vouchedId || !swapId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Check that the swap exists and is accepted
  const swap = await prisma.swapRequest.findUnique({ where: { id: swapId } });
  if (!swap || swap.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Swap not found or not completed" }, { status: 400 });
  }
  // Prevent duplicate vouches for the same swap/user pair
  const existingVouch = await prisma.vouch.findFirst({
    where: {
      voucherId,
      vouchedId,
      swapId,
    },
  });
  if (existingVouch) {
    return NextResponse.json({ error: "You have already vouched for this user for this swap." }, { status: 409 });
  }
  // Create the vouch
  const vouch = await prisma.vouch.create({
    data: {
      voucherId,
      vouchedId,
      swapId,
    },
  });
  return NextResponse.json({ success: true, vouch });
}
