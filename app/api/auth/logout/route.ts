import { NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await destroySession();
    const response = jsonCorsResponse(
      {
        success: true,
        data: { message: "Logged out successfully" },
      },
      undefined,
      req
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Logout route error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to logout." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

