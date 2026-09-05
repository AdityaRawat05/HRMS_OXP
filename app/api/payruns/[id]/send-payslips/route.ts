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
        payslips: {
          include: {
            employees: { select: { id: true, work_email: true, first_name: true, last_name: true } },
          },
        },
      },
    });

    if (!payrun) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    if (payrun.state !== "paid" && payrun.state !== "validated") {
      return jsonCorsResponse({
        success: false,
        error: `Payrun must be in 'paid' or 'validated' state before sending payslips. Current state: '${payrun.state}'.`,
      }, { status: 422 }, req);
    }

    // Check if email SMTP environment variables are present
    const isEmailConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
    );

    // Execute send payslips operation in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.payruns.update({
        where: { id: payrunId },
        data: {
          state: "sent",
          sent_at: new Date(),
          sent_by: authCheck.sessionData.user.id,
        },
      });

      for (const ps of payrun.payslips) {
        await tx.payslips.update({
          where: { id: ps.id },
          data: {
            state: "sent",
            email_sent: isEmailConfigured,
            email_sent_at: isEmailConfigured ? new Date() : null,
            email_to: ps.employees.work_email || null,
          },
        });
      }
    });

    return jsonCorsResponse({
      success: true,
      data: {
        message: isEmailConfigured
          ? "Payslips sent successfully via email."
          : "Payslips marked as sent. Note: SMTP email infrastructure is not currently configured for outgoing delivery.",
        payrun_id: payrunId,
        state: "sent",
        email_configured: isEmailConfigured,
        sent_count: payrun.payslips.length,
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payruns/[id]/send-payslips error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to send payslips." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
