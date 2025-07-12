import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url!);
  const id = url.pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      location: true,
      image: true,
      availability: true,
      isPublic: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const url = new URL(req.url!);
  const id = url.pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  const { name, location, image, availability, isPublic } = await req.json();
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, location, image, availability, isPublic },
      select: {
        id: true,
        name: true,
        location: true,
        image: true,
        availability: true,
        isPublic: true,
      },
    });
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
