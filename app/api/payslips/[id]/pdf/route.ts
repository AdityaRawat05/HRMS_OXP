import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { handleOptions } from "@/lib/cors";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const payslipIdRaw = params.id;
    let payslipIdBigInt: bigint;
    try {
      payslipIdBigInt = BigInt(payslipIdRaw);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid payslip ID format." }, { status: 400 });
    }

    const payslip = await prisma.payslips.findUnique({
      where: { id: payslipIdBigInt },
      include: {
        employees: {
          select: {
            id: true,
            user_id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
            bank_name: true,
            bank_account_no: true,
            bank_ifsc_code: true,
            pan_number: true,
            uan_number: true,
            esi_number: true,
            departments_employees_department_idTodepartments: { select: { name: true } },
            job_titles: { select: { name: true } },
            companies: { select: { name: true } },
          },
        },
        employee_contracts: {
          include: {
            salary_structures: { select: { name: true } },
          },
        },
        payroll_periods: {
          select: { name: true, date_from: true, date_to: true },
        },
        payruns: {
          select: { name: true, reference: true, salary_structures: { select: { name: true } } },
        },
        payslip_lines: {
          include: {
            salary_rule_categories: { select: { name: true, code: true } },
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!payslip) {
      return NextResponse.json({ success: false, error: "Payslip not found." }, { status: 404 });
    }

    // RBAC Check: Employees can only download their own payslips
    const isHrOrAdmin = session.roles.some((r) => ["admin", "hr_manager", "payroll_manager"].includes(r.name));
    if (!isHrOrAdmin && payslip.employees.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    // Generate PDF document using PDFKit
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));
    });

    const emp = payslip.employees;
    const companyName = emp.companies?.name || "PeoplePay360 Enterprise";
    const periodName = payslip.payroll_periods.name;
    const dateFromStr = payslip.date_from.toISOString().split("T")[0];
    const dateToStr = payslip.date_to.toISOString().split("T")[0];
    const structureName = payslip.employee_contracts?.salary_structures?.name || payslip.payruns.salary_structures.name;

    // --- Header Section ---
    doc.font("Helvetica-Bold").fillColor("#0F172A").fontSize(20).text("PeoplePay360", 40, 40);
    doc.font("Helvetica").fillColor("#475569").fontSize(10).text("PAYSLIP STATEMENT", 40, 65);
    doc.fillColor("#475569").fontSize(9).text(companyName, 400, 40, { align: "right" });
    doc.fillColor("#64748B").fontSize(8).text(`Ref: ${payslip.reference}`, 400, 53, { align: "right" });
    doc.fillColor("#64748B").fontSize(8).text(`Status: ${payslip.state.toUpperCase()}`, 400, 65, { align: "right" });

    doc.moveTo(40, 80).lineTo(555, 80).strokeColor("#CBD5E1").lineWidth(1).stroke();

    // --- Employee & Period Details Grid ---
    doc.fillColor("#0F172A").fontSize(11).text("EMPLOYEE DETAILS", 40, 92, { underline: true });
    doc.fontSize(9).fillColor("#334155");

    doc.text(`Employee Name: ${emp.first_name} ${emp.last_name}`, 40, 110);
    doc.text(`Employee Code: ${emp.employee_code}`, 40, 124);
    doc.text(`Department: ${emp.departments_employees_department_idTodepartments?.name || "N/A"}`, 40, 138);
    doc.text(`Job Title: ${emp.job_titles?.name || "N/A"}`, 40, 152);

    doc.text(`Pay Period: ${periodName}`, 300, 110);
    doc.text(`Period Dates: ${dateFromStr} → ${dateToStr}`, 300, 124);
    doc.text(`Salary Structure: ${structureName}`, 300, 138);
    doc.text(`Bank Account: ${emp.bank_account_no || "N/A"} (${emp.bank_name || "N/A"})`, 300, 152);

    doc.moveTo(40, 170).lineTo(555, 170).strokeColor("#E2E8F0").lineWidth(1).stroke();

    // --- Worked Days Summary ---
    doc.fillColor("#0F172A").fontSize(10).text("ATTENDANCE SUMMARY", 40, 180);
    doc.fontSize(8.5).fillColor("#475569");
    doc.text(`Working Days: ${payslip.total_working_days}`, 40, 195);
    doc.text(`Days Worked: ${payslip.days_worked}`, 170, 195);
    doc.text(`Days Absent: ${payslip.days_absent}`, 300, 195);
    doc.text(`Leave Taken: ${payslip.leave_days_taken}`, 430, 195);

    doc.moveTo(40, 212).lineTo(555, 212).strokeColor("#CBD5E1").lineWidth(1).stroke();

    // --- Salary Lines Table Header ---
    let y = 225;
    doc.fillColor("#1E293B").fontSize(9).text("SALARY COMPUTATION BREAKDOWN", 40, y);
    y += 15;

    // Table Header Bar
    doc.rect(40, y, 515, 20).fill("#F1F5F9");
    doc.fillColor("#334155").fontSize(8.5);
    doc.text("Rule / Component", 48, y + 5);
    doc.text("Category", 230, y + 5);
    doc.text("Type", 340, y + 5);
    doc.text("Amount (INR)", 450, y + 5, { align: "right" });
    y += 24;

    // Table Rows
    doc.fillColor("#1E293B").fontSize(8.5);
    for (const line of payslip.payslip_lines) {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }

      const categoryName = line.salary_rule_categories?.name || line.code;
      const formattedAmount = Number(line.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      doc.text(line.name, 48, y);
      doc.text(categoryName, 230, y);
      doc.text(line.calculation_type, 340, y);
      doc.text(`₹ ${formattedAmount}`, 430, y, { width: 110, align: "right" });

      y += 16;
      doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor("#F1F5F9").lineWidth(0.5).stroke();
    }

    // --- Financial Totals Summary Box ---
    y += 15;
    if (y > 680) {
      doc.addPage();
      y = 40;
    }

    doc.rect(40, y, 515, 65).fill("#F8FAFC").strokeColor("#CBD5E1").lineWidth(1).stroke();
    y += 10;

    const basicFormatted = Number(payslip.basic_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const grossFormatted = Number(payslip.gross_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const dedFormatted = Number(payslip.total_deductions).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const netFormatted = Number(payslip.net_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    doc.font("Helvetica").fillColor("#334155").fontSize(9);
    doc.text(`Basic Salary: ₹ ${basicFormatted}`, 55, y);
    doc.text(`Total Deductions: ₹ ${dedFormatted}`, 320, y);

    y += 16;
    doc.text(`Gross Salary: ₹ ${grossFormatted}`, 55, y);
    doc.font("Helvetica-Bold").fillColor("#0F172A").fontSize(10).text(`NET PAYABLE: ₹ ${netFormatted}`, 320, y);
    doc.font("Helvetica");

    y += 25;
    doc.fillColor("#64748B").fontSize(7.5).text("This is a computer-generated payslip statement and does not require a physical signature.", 40, y + 25, { align: "center" });

    doc.end();

    const pdfBuffer = await pdfPromise;

    // Update PDF generation metadata in DB
    try {
      await prisma.payslips.update({
        where: { id: payslipIdBigInt },
        data: {
          pdf_generated_at: new Date(),
        },
      });
    } catch {}

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Payslip-${payslip.reference}.pdf"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (error: any) {
    console.error("GET /api/payslips/[id]/pdf error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate payslip PDF." }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
