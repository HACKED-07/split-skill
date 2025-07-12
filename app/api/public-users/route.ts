import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const id = searchParams.get("id");
  const skill = searchParams.get("skill");
  const availability = searchParams.get("availability");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 9;
  const skip = (page - 1) * limit;

  if (id) {
    // Fetch a single user by id
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        location: true,
        availability: true,
        skills: true,
      },
    });
    if (!user) return NextResponse.json([], { status: 404 });

    // Calculate average rating for this user
    const feedback = await prisma.feedback.findMany({
      where: {
        swap: {
          OR: [
            { fromUserId: user.id },
            { toUserId: user.id },
          ],
        },
      },
      select: { rating: true },
    });
    const avgRating = feedback.length > 0
      ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length
      : null;
    return NextResponse.json([{ ...user, avgRating, feedbackCount: feedback.length }]);
  }

  let users;
  const where: any = { isPublic: true };
  if (skill) {
    where.skills = { some: { name: { contains: skill } } };
  }
  if (availability) {
    where.availability = { contains: availability };
  }
  users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      image: true,
      location: true,
      availability: true,
      skills: true,
    },
    skip,
    take: limit,
  });

  // Calculate average ratings for each user
  const usersWithRatings = await Promise.all(
    users.map(async (user: any) => {
      const feedback = await prisma.feedback.findMany({
        where: {
          swap: {
            OR: [
              { fromUserId: user.id },
              { toUserId: user.id },
            ],
          },
        },
        select: {
          rating: true,
        },
      });

      const avgRating = feedback.length > 0 
        ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length 
        : null;

      return {
        ...user,
        avgRating,
        feedbackCount: feedback.length,
      };
    })
  );

  return NextResponse.json(usersWithRatings);
}
