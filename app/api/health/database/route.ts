import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rolesCount = await prisma.roles.count();

    return NextResponse.json({
      status: "ok",
      database: "peoplepay360",
      rolesCount,
    });
  } catch (error) {
    console.error("Database health query failed");
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: "Failed to query the database table",
      },
      { status: 503 }
    );
  }
}
