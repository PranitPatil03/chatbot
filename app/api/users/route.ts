import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import type { User } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, fullName, email } = body;

    const users = await getCollection("users");
    const result = await users.insertOne({
      username,
      fullName,
      email,
      role: "user",
      createdAt: new Date(),
    } as User);

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
