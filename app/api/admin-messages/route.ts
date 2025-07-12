import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const MESSAGE_PATH = path.join(process.cwd(), "public", "platform-message.txt");

async function isAdmin(req: Request) {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const msg = await readFile(MESSAGE_PATH, "utf-8");
    return NextResponse.json({ message: msg });
  } catch {
    return NextResponse.json({ message: "" });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { message } = await req.json();
  if (typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  await writeFile(MESSAGE_PATH, message, "utf-8");
  return NextResponse.json({ success: true });
}
