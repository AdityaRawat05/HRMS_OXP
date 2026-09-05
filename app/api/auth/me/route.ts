import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const origin = req.headers.get("origin") || "*";
    const sessionData = await getSessionUser();
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. No valid session." },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          authenticated: true,
          user: sessionData.user,
          roles: sessionData.roles,
          permissions: sessionData.permissions,
          isAdmin: sessionData.isAdmin,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Auth me route error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

