import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Execute a lightweight query to verify connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed");
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: "Failed to connect to the database",
      },
      { status: 503 }
    );
  }
}
