import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword, SESSION_COOKIE_NAME, SESSION_DURATION_DAYS } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { email, password } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid work email." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      include: {
        user_roles: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: "Your account is inactive. Contact an administrator." },
        { status: 403 }
      );
    }

    if (user.is_locked) {
      return NextResponse.json(
        { success: false, error: "Your account is locked. Contact an administrator." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      const attempts = user.failed_login_attempts + 1;
      const shouldLock = attempts >= 5;

      await prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: attempts,
          is_locked: shouldLock,
        },
      });

      if (shouldLock) {
        return NextResponse.json(
          { success: false, error: "Account locked due to too many failed attempts." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Reset failed attempts & record last_login_at
    await prisma.users.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        last_login_at: new Date(),
      },
    });

    // Create session
    const sessionToken = await createSession(user.id, req);

    const roles = user.user_roles.map((ur) => ({
      id: ur.roles.id,
      name: ur.roles.name,
      display_name: ur.roles.display_name,
    }));

    const permissionsSet = new Set<string>();
    for (const ur of user.user_roles) {
      for (const rp of ur.roles.role_permissions) {
        permissionsSet.add(
          `${rp.permissions.module}:${rp.permissions.action}:${rp.permissions.resource}`
        );
      }
    }

    const permissions = Array.from(permissionsSet);
    const isAdmin =
      roles.some((r) => r.name === "admin" || r.name === "hr_manager") ||
      permissions.includes("system:manage:users");

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          employee: user.employees
            ? {
                id: user.employees.id,
                name: `${user.employees.first_name} ${user.employees.last_name}`.trim(),
                employee_code: user.employees.employee_code,
                work_email: user.employees.work_email,
              }
            : null,
        },
        roles,
        permissions,
        isAdmin,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
