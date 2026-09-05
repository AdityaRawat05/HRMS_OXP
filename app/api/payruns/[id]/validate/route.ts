import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const payrunId = Number(params.id);
    if (isNaN(payrunId)) {
      return jsonCorsResponse({ success: false, error: "Invalid payrun ID." }, { status: 400 }, req);
    }

    const payrun = await prisma.payruns.findUnique({
      where: { id: payrunId },
      include: {
        payrun_warnings: {
          where: { is_resolved: false, severity: "error" },
        },
        _count: { select: { payslips: true } },
      },
    });

    if (!payrun) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    if (payrun.state !== "computed") {
      return jsonCorsResponse({
        success: false,
        error: `Payrun must be in 'computed' state before validation. Current state: '${payrun.state}'.`,
      }, { status: 422 }, req);
    }

    if (payrun._count.payslips === 0) {
      return jsonCorsResponse({
        success: false,
        error: "Payrun has no payslips to validate.",
      }, { status: 422 }, req);
    }

    // Check for blocking error-severity unresolved warnings
    if (payrun.payrun_warnings.length > 0) {
      const errorMessages = payrun.payrun_warnings.map((w) => w.message).join(" | ");
      return jsonCorsResponse({
        success: false,
        error: `Payrun has blocking errors and cannot be validated: ${errorMessages}`,
      }, { status: 422 }, req);
    }

    // Perform validation in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payruns.update({
        where: { id: payrunId },
        data: {
          state: "validated",
          validated_at: new Date(),
          validated_by: authCheck.sessionData.user.id,
        },
      });

      await tx.payslips.updateMany({
        where: { payrun_id: payrunId },
        data: { state: "validated" },
      });
    });

    return jsonCorsResponse({
      success: true,
      data: {
        message: "Payrun validated successfully.",
        payrun_id: payrunId,
        state: "validated",
        validated_at: new Date(),
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payruns/[id]/validate error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to validate payrun." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
