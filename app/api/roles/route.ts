import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    return jsonCorsResponse({
      success: true,
      data: { roles },
    }, undefined, req);
  } catch (error) {
    console.error("Roles route error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to fetch roles." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
