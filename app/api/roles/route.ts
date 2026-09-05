import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      where: { is_active: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        display_name: true,
        description: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    console.error("Roles route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles." },
      { status: 500 }
    );
  }
}
