import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionData = await getSessionUser();
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. No valid session." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: sessionData.user,
        roles: sessionData.roles,
        permissions: sessionData.permissions,
        isAdmin: sessionData.isAdmin,
      },
    });
  } catch (error) {
    console.error("Auth me route error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
