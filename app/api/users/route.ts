import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const role = searchParams.get("role")?.trim() || "";

    const users = await prisma.users.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { first_name: { contains: search } },
                  { last_name: { contains: search } },
                  { email: { contains: search } },
                  {
                    employees: {
                      OR: [
                        { first_name: { contains: search } },
                        { last_name: { contains: search } },
                        { work_email: { contains: search } },
                      ],
                    },
                  },
                ],
              }
            : {},
          role && role !== "all"
            ? {
                user_roles: {
                  some: {
                    roles: {
                      OR: [
                        { name: role },
                        { display_name: role },
                        ...(isNaN(Number(role)) ? [] : [{ id: Number(role) }]),
                      ],
                    },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
          },
        },
        user_roles: {
          include: {
            roles: {
              select: {
                id: true,
                name: true,
                display_name: true,
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formattedUsers = users.map((u) => {
      const roles = u.user_roles.map((ur) => ur.roles);
      const employee = u.employees
        ? {
            id: u.employees.id,
            name: `${u.employees.first_name} ${u.employees.last_name}`.trim(),
            employee_code: u.employees.employee_code,
            work_email: u.employees.work_email,
          }
        : null;

      return {
        id: u.id,
        name: `${u.first_name} ${u.last_name}`.trim() || u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        is_active: u.is_active,
        is_locked: u.is_locked,
        employee,
        roles,
        primary_role: roles[0]?.display_name || roles[0]?.name || "Employee",
      };
    });

    return NextResponse.json({
      success: true,
      data: { users: formattedUsers },
    });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name, employee_id, role_ids, is_active } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid work email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    let resolvedFirstName = (first_name || "").trim();
    let resolvedLastName = (last_name || "").trim();

    // If employee provided, verify and borrow name if empty
    if (employee_id) {
      const emp = await prisma.employees.findUnique({
        where: { id: Number(employee_id) },
      });
      if (emp) {
        if (!resolvedFirstName) resolvedFirstName = emp.first_name;
        if (!resolvedLastName) resolvedLastName = emp.last_name;
      }
    }

    if (!resolvedFirstName) {
      resolvedFirstName = normalizedEmail.split("@")[0];
    }

    const rawPassword = password && typeof password === "string" && password.trim()
      ? password.trim()
      : "Welcome@123";
    const passwordHash = await hashPassword(rawPassword);

    // Execute in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          email: normalizedEmail,
          password_hash: passwordHash,
          first_name: resolvedFirstName,
          last_name: resolvedLastName,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
      });

      if (employee_id) {
        await tx.employees.update({
          where: { id: Number(employee_id) },
          data: { user_id: createdUser.id },
        });
      }

      if (Array.isArray(role_ids) && role_ids.length > 0) {
        for (const rId of role_ids) {
          await tx.user_roles.create({
            data: {
              user_id: createdUser.id,
              role_id: Number(rId),
              assigned_by: authCheck.sessionData.user.id,
            },
          });
        }
      } else {
        // Default to Employee role (id: 5)
        await tx.user_roles.create({
          data: {
            user_id: createdUser.id,
            role_id: 5,
            assigned_by: authCheck.sessionData.user.id,
          },
        });
      }

      return createdUser;
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
        },
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user." },
      { status: 500 }
    );
  }
}
