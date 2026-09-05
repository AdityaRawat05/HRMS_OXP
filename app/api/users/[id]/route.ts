import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return jsonCorsResponse(
        { success: false, error: "Invalid user ID." },
        { status: 400 },
        req
      );
    }

    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
            bank_name: true,
            bank_account_no: true,
            bank_ifsc_code: true,
            bank_branch: true,
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
    });

    if (!user) {
      return jsonCorsResponse(
        { success: false, error: "User not found." },
        { status: 404 },
        req
      );
    }

    return jsonCorsResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          is_locked: user.is_locked,
          employee: user.employees,
          roles: user.user_roles.map((ur) => ur.roles),
        },
      },
    }, undefined, req);
  } catch (error) {
    console.error("Get user error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to fetch user." },
      { status: 500 },
      req
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return jsonCorsResponse(
        { success: false, error: "Invalid user ID." },
        { status: 400 },
        req
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 },
        req
      );
    }

    const { email, first_name, last_name, is_active, role_ids, employee_id, password } = body || {};

    const user = await prisma.users.findUnique({
      where: { id },
      include: { employees: true },
    });

    if (!user) {
      return jsonCorsResponse(
        { success: false, error: "User not found." },
        { status: 404 },
        req
      );
    }

    const updateData: any = {};
    if (email && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await prisma.users.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing && existing.id !== id) {
          return jsonCorsResponse(
            { success: false, error: "Email already in use by another user." },
            { status: 409 },
            req
          );
        }
        updateData.email = normalizedEmail;
      }
    }

    if (first_name !== undefined) updateData.first_name = String(first_name).trim();
    if (last_name !== undefined) updateData.last_name = String(last_name).trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    if (password && typeof password === "string" && password.trim().length > 0) {
      updateData.password_hash = await hashPassword(password.trim());
      updateData.password_changed_at = new Date();
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.users.update({
          where: { id },
          data: updateData,
        });
      }

      if (Array.isArray(role_ids)) {
        await tx.user_roles.deleteMany({
          where: { user_id: id },
        });

        for (const rId of role_ids) {
          await tx.user_roles.create({
            data: {
              user_id: id,
              role_id: Number(rId),
              assigned_by: authCheck.sessionData.user.id,
            },
          });
        }
      }

      if (employee_id !== undefined) {
        const newEmpId = employee_id ? Number(employee_id) : null;
        const currentEmpId = user.employees?.id || null;

        if (newEmpId !== currentEmpId) {
          if (currentEmpId) {
            await tx.employees.update({
              where: { id: currentEmpId },
              data: { user_id: null },
            });
          }
          if (newEmpId) {
            await tx.employees.update({
              where: { id: newEmpId },
              data: { user_id: id },
            });
          }
        }
      }
    });

    return jsonCorsResponse({
      success: true,
      data: { message: "User updated successfully." },
    }, undefined, req);
  } catch (error) {
    console.error("Update user error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to update user." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
