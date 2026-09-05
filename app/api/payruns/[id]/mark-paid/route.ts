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
    });

    if (!payrun) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    if (payrun.state !== "validated") {
      return jsonCorsResponse({
        success: false,
        error: `Payrun must be in 'validated' state before marking paid. Current state: '${payrun.state}'.`,
      }, { status: 422 }, req);
    }

    // Perform mark paid operation in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payruns.update({
        where: { id: payrunId },
        data: {
          state: "paid",
          paid_at: new Date(),
          paid_by: authCheck.sessionData.user.id,
        },
      });

      await tx.payslips.updateMany({
        where: { payrun_id: payrunId },
        data: { state: "paid" },
      });
    });

    return jsonCorsResponse({
      success: true,
      data: {
        message: "Payrun marked as paid successfully.",
        payrun_id: payrunId,
        state: "paid",
        paid_at: new Date(),
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payruns/[id]/mark-paid error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to mark payrun as paid." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
