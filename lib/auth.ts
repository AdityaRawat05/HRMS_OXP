import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "pp360_session";
export const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface UserSessionData {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_locked: boolean;
  };
  roles: {
    id: number;
    name: string;
    display_name: string;
  }[];
  permissions: string[];
  isAdmin: boolean;
}

export async function createSession(userId: number, req?: Request): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  let ipAddress = "127.0.0.1";
  let userAgent = "unknown";

  if (req) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      ipAddress = forwarded.split(",")[0].trim();
    }
    const ua = req.headers.get("user-agent");
    if (ua) {
      userAgent = ua.substring(0, 500);
    }
  }

  await prisma.user_sessions.create({
    data: {
      user_id: userId,
      session_token: token,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
    },
  });

  return token;
}

export async function getSessionUser(): Promise<UserSessionData | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await prisma.user_sessions.findFirst({
      where: {
        session_token: token,
        expires_at: { gt: new Date() },
      },
      include: {
        users: {
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
          },
        },
      },
    });

    if (!session || !session.users || !session.users.is_active || session.users.is_locked) {
      return null;
    }

    const user = session.users;
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

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        is_locked: user.is_locked,
      },
      roles,
      permissions,
      isAdmin,
    };
  } catch (err) {
    console.error("Error retrieving session user:", err);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.user_sessions.deleteMany({
        where: { session_token: token },
      });
    }
  } catch (err) {
    console.error("Error destroying session:", err);
  }
}

export async function requireAdmin(): Promise<
  { authorized: true; sessionData: UserSessionData } | { authorized: false; response: NextResponse }
> {
  const sessionData = await getSessionUser();
  if (!sessionData) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (!sessionData.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Insufficient permissions. Admin authorization required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, sessionData };
}
