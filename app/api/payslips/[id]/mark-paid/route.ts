import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const payslipIdRaw = params.id;
    let payslipIdBigInt: bigint;
    try {
      payslipIdBigInt = BigInt(payslipIdRaw);
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid payslip ID format." }, { status: 400 }, req);
    }

    const payslip = await prisma.payslips.findUnique({
      where: { id: payslipIdBigInt },
      include: {
        payruns: { select: { id: true, state: true } },
      },
    });

    if (!payslip) {
      return jsonCorsResponse({ success: false, error: "Payslip not found." }, { status: 404 }, req);
    }

    // Check parent payrun status enforcement
    if (payslip.payruns.state !== "validated" && payslip.payruns.state !== "paid") {
      return jsonCorsResponse({
        success: false,
        error: `Cannot mark payslip as paid while parent payrun state is '${payslip.payruns.state}'. Parent payrun must be validated or paid.`,
      }, { status: 422 }, req);
    }

    if (payslip.state === "paid") {
      return jsonCorsResponse({ success: false, error: "Payslip is already marked as paid." }, { status: 409 }, req);
    }

    const updatedPayslip = await prisma.payslips.update({
      where: { id: payslipIdBigInt },
      data: {
        state: "paid",
      },
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payslip: {
          id: updatedPayslip.id.toString(),
          state: updatedPayslip.state,
          updated_at: updatedPayslip.updated_at,
        },
        message: "Payslip marked as paid successfully.",
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payslips/[id]/mark-paid error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to mark payslip as paid." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
